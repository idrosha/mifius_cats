using Mythfel.Client.Data;
using Mythfel.Client.Net;
using Mythfel.Client.UI;

namespace Mythfel.Client.Battle;

/// <summary>
/// Battle presenter (§9 Game/Battle): binds server stateDiff to HUD.
/// Never authoritative for damage/rewards (§3.6).
/// </summary>
public sealed class BattlePresenter
{
    private readonly IBattleNetClient _net;
    private readonly ILocCatalog _loc;
    private readonly IBattleHudView _view;
    private readonly int _localSide;

    public BattleViewState State { get; private set; } = new();

    public BattlePresenter(
        IBattleNetClient net,
        ILocCatalog loc,
        IBattleHudView view,
        int localSide = 0)
    {
        _net = net ?? throw new ArgumentNullException(nameof(net));
        _loc = loc ?? throw new ArgumentNullException(nameof(loc));
        _view = view ?? throw new ArgumentNullException(nameof(view));
        _localSide = localSide;
    }

    public void ApplyStateDiff(StateDiff diff)
    {
        if (diff is null) throw new ArgumentNullException(nameof(diff));

        var local = _localSide == 0 ? diff.P1 : diff.P2;
        var allies = new List<UnitView>(3);
        var enemies = new List<UnitView>(3);

        foreach (var u in diff.Units.OrderBy(x => x.Lane))
        {
            var view = ToUnitView(u);
            if (u.Side == _localSide) allies.Add(view);
            else enemies.Add(view);
        }

        State = new BattleViewState
        {
            BattleId = diff.BattleId,
            Seq = diff.Seq,
            Turn = diff.Turn,
            ActiveSide = diff.Active,
            Result = diff.Result ?? "",
            Energy = local.Energy,
            MilkDrops = local.MilkDrops,
            MilkBursts = local.MilkBursts,
            KeepCost = local.KeepCost,
            CanKeep = diff.CanKeep,
            CanEndTurn = diff.CanEndTurn && diff.Active == _localSide && string.IsNullOrEmpty(diff.Result),
            AllyBoard = allies,
            EnemyBoard = enemies,
            Hand = diff.Hand.Select(ToHandView).ToList(),
            PotionTray = diff.PotionTray.Select(ToPotionView).ToList(),
        };

        _view.Render(State);
    }

    public async Task SubmitAsync(BattleAction action, CancellationToken ct = default)
    {
        if (action is null) throw new ArgumentNullException(nameof(action));
        // Client does not validate combat legality as truth — server rejects (§8.2).
        var diff = await _net.SubmitActionAsync(State.BattleId, action, ct).ConfigureAwait(false);
        ApplyStateDiff(diff);
    }

    private static UnitView ToUnitView(UnitDiff u) => new()
    {
        Id = u.Id,
        Lane = u.Lane,
        Role = u.Role,
        Element = u.Element,
        Hp = u.Hp,
        MaxHp = u.MaxHp,
        Shield = u.Shield,
        Alive = u.Alive,
        StatusIds = u.Statuses.Select(s => s.Id).ToList(),
        HandCount = u.HandCount,
    };

    private HandCardView ToHandView(HandCardDiff c) => new()
    {
        UnitId = c.UnitId,
        HandIndex = c.HandIndex,
        CardId = c.CardId,
        NameKey = c.NameKey,
        DisplayName = _loc.Resolve(c.NameKey),
        Cost = c.Cost,
        Playable = c.Playable,
    };

    private PotionSlotView ToPotionView(PotionSlotDiff p) => new()
    {
        PotionId = p.PotionId,
        NameKey = p.NameKey,
        DisplayName = _loc.Resolve(p.NameKey),
        Available = p.Available,
    };
}
