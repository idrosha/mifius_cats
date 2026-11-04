namespace Mythfel.Client.Meta;

public sealed class TutorialViewState
{
    public TutorialStepId Step { get; init; }

    public string StepKey { get; init; } = "";

    public string StepLabel { get; init; } = "";

    /// <summary>Fixed SL starter templateIds (§1 / content/cats/starters.json).</summary>
    public IReadOnlyList<string> StarterTeam { get; init; } = Array.Empty<string>();

    public string? BattleId { get; init; }

    public string? StageId { get; init; }

    public string? BattleResult { get; init; }

    public bool IsComplete { get; init; }

    public bool IsFailed { get; init; }

    /// <summary>Elapsed since Begin; budget is 10 minutes (§13.1).</summary>
    public TimeSpan Elapsed { get; init; }

    public TimeSpan Budget { get; init; }

    public IReadOnlyList<string> EmittedTutorialSteps { get; init; } = Array.Empty<string>();
}
