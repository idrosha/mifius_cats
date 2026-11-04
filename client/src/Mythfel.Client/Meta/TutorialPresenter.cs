using Mythfel.Client.Battle;
using Mythfel.Client.Data;
using Mythfel.Client.Net;
using Mythfel.Client.UI;

namespace Mythfel.Client.Meta;

/// <summary>
/// Soft-launch tutorial (§13.1): starters → CreatePvE Двор → victory under 10 minutes.
/// Combat authority remains server stateDiff (§3.6 / §8.2); no local damage/rewards.
/// </summary>
public sealed class TutorialPresenter
{
    /// <summary>Three starters from content/cats/starters.json (§1 MUST / §10).</summary>
    public static readonly IReadOnlyList<string> SoftLaunchStarters = new[]
    {
        "starter_tank_stone",
        "starter_fighter_fire",
        "starter_support_water",
    };

    /// <summary>Golden / SL practice node used by battle acceptance (§13.1).</summary>
    public const string SoftLaunchYardStageId = "test_yard_1";

    /// <summary>§13.1 budget: Туториал → победа Двора &lt;10 мин.</summary>
    public static readonly TimeSpan SoftLaunchBudget = TimeSpan.FromMinutes(10);

    private readonly IBattleNetClient _net;
    private readonly ILocCatalog _loc;
    private readonly ITutorialView _view;
    private readonly Func<DateTimeOffset> _clock;
    private readonly List<string> _emitted = new();

    private DateTimeOffset _startedAt;
    private string? _battleId;
    private string? _stageId;
    private string? _battleResult;

    public TutorialViewState State { get; private set; } = new()
    {
        Budget = SoftLaunchBudget,
        StarterTeam = SoftLaunchStarters,
    };

    public TutorialPresenter(
        IBattleNetClient net,
        ILocCatalog loc,
        ITutorialView view,
        Func<DateTimeOffset>? clock = null)
    {
        _net = net ?? throw new ArgumentNullException(nameof(net));
        _loc = loc ?? throw new ArgumentNullException(nameof(loc));
        _view = view ?? throw new ArgumentNullException(nameof(view));
        _clock = clock ?? (() => DateTimeOffset.UtcNow);
    }

    /// <summary>Start tutorial clock; first step = starters (§13.1 / §11 tutorial_step).</summary>
    public void Begin()
    {
        _startedAt = _clock();
        _battleId = null;
        _stageId = null;
        _battleResult = null;
        _emitted.Clear();
        EmitStep(TutorialStepId.Starters);
        Push(TutorialStepId.Starters);
    }

    /// <summary>
    /// CreatePvE on server with SL starters (§8.2). Stage defaults to practice yard.
    /// </summary>
    public async Task StartYardBattleAsync(
        string stageId = SoftLaunchYardStageId,
        IReadOnlyList<string>? potions = null,
        CancellationToken ct = default)
    {
        EnsureBegun();
        if (State.IsComplete || State.IsFailed)
            throw new InvalidOperationException("tutorial already finished");

        if (Elapsed() > SoftLaunchBudget)
        {
            FailOvertime();
            return;
        }

        var team = SoftLaunchStarters;
        var diff = await _net.CreatePvEAsync(stageId, team, potions, ct).ConfigureAwait(false);
        _battleId = diff.BattleId;
        _stageId = stageId;
        EmitStep(TutorialStepId.YardBattle);
        Push(TutorialStepId.YardBattle);
    }

    /// <summary>
    /// Bind server battle result. Victory must be <c>p1_win</c> within budget — client does not invent outcome.
    /// </summary>
    public void ApplyBattleResult(string result)
    {
        EnsureBegun();
        if (State.IsComplete || State.IsFailed)
            return;

        if (string.IsNullOrEmpty(_battleId))
            throw new InvalidOperationException("yard battle not started");

        _battleResult = result ?? "";
        if (Elapsed() > SoftLaunchBudget)
        {
            FailOvertime();
            return;
        }

        if (!string.Equals(result, "p1_win", StringComparison.Ordinal))
        {
            // Not a soft-launch pass yet — stay on yard battle until win (or overtime).
            Push(TutorialStepId.YardBattle);
            return;
        }

        EmitStep(TutorialStepId.Victory);
        Push(TutorialStepId.Victory, complete: true);
    }

    /// <summary>Convenience: read Result from authoritative stateDiff.</summary>
    public void ApplyStateDiff(StateDiff diff)
    {
        if (diff is null) throw new ArgumentNullException(nameof(diff));
        if (!string.IsNullOrEmpty(diff.BattleId))
            _battleId ??= diff.BattleId;
        if (!string.IsNullOrEmpty(diff.Result))
            ApplyBattleResult(diff.Result);
    }

    private void FailOvertime()
    {
        EmitStep(TutorialStepId.FailedOvertime);
        Push(TutorialStepId.FailedOvertime, failed: true);
    }

    private void EnsureBegun()
    {
        if (State.Step == TutorialStepId.None && _emitted.Count == 0)
            throw new InvalidOperationException("call Begin() first");
    }

    private TimeSpan Elapsed() => _clock() - _startedAt;

    private void EmitStep(TutorialStepId step)
    {
        var id = StepAnalyticsId(step);
        _emitted.Add(id);
    }

    private void Push(TutorialStepId step, bool complete = false, bool failed = false)
    {
        var key = StepNameKey(step);
        State = new TutorialViewState
        {
            Step = step,
            StepKey = key,
            StepLabel = string.IsNullOrEmpty(key) ? "" : _loc.Resolve(key),
            StarterTeam = SoftLaunchStarters,
            BattleId = _battleId,
            StageId = _stageId,
            BattleResult = _battleResult,
            IsComplete = complete,
            IsFailed = failed,
            Elapsed = Elapsed(),
            Budget = SoftLaunchBudget,
            EmittedTutorialSteps = _emitted.ToList(),
        };
        _view.Render(State);
    }

    private static string StepNameKey(TutorialStepId step) => step switch
    {
        TutorialStepId.Starters => "tutorial.step.starters",
        TutorialStepId.YardBattle => "tutorial.step.yard_battle",
        TutorialStepId.Victory => "tutorial.step.victory",
        TutorialStepId.FailedOvertime => "tutorial.step.overtime",
        _ => "",
    };

    /// <summary>Payload id for analytics event <c>tutorial_step</c> (§11).</summary>
    public static string StepAnalyticsId(TutorialStepId step) => step switch
    {
        TutorialStepId.Starters => "starters",
        TutorialStepId.YardBattle => "yard_battle",
        TutorialStepId.Victory => "victory",
        TutorialStepId.FailedOvertime => "overtime",
        _ => "none",
    };
}
