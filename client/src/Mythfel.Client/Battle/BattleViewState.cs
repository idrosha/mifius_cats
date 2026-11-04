namespace Mythfel.Client.Battle;

/// <summary>
/// HUD-facing snapshot for Battle screen (§6 item 9). Pure presentation.
/// </summary>
public sealed class BattleViewState
{
    public string BattleId { get; init; } = "";
    public int Seq { get; init; }
    public int Turn { get; init; }
    public int ActiveSide { get; init; }
    public string Result { get; init; } = "";
    public bool IsFinished => !string.IsNullOrEmpty(Result);

    public int Energy { get; init; }
    public int MilkDrops { get; init; }
    public int MilkBursts { get; init; }
    public int KeepCost { get; init; }
    public bool CanKeep { get; init; }
    public bool CanEndTurn { get; init; }

    /// <summary>Board: own 3 + enemy 3 by lane.</summary>
    public IReadOnlyList<UnitView> AllyBoard { get; init; } = Array.Empty<UnitView>();
    public IReadOnlyList<UnitView> EnemyBoard { get; init; } = Array.Empty<UnitView>();

    public IReadOnlyList<HandCardView> Hand { get; init; } = Array.Empty<HandCardView>();
    public IReadOnlyList<PotionSlotView> PotionTray { get; init; } = Array.Empty<PotionSlotView>();
}

public sealed class UnitView
{
    public string Id { get; init; } = "";
    public int Lane { get; init; }
    public string Role { get; init; } = "";
    public string Element { get; init; } = "";
    public int Hp { get; init; }
    public int MaxHp { get; init; }
    public int Shield { get; init; }
    public bool Alive { get; init; }
    public IReadOnlyList<string> StatusIds { get; init; } = Array.Empty<string>();
    public int HandCount { get; init; }
}

public sealed class HandCardView
{
    public string UnitId { get; init; } = "";
    public int HandIndex { get; init; }
    public string CardId { get; init; } = "";
    public string NameKey { get; init; } = "";
    public string DisplayName { get; init; } = "";
    public int Cost { get; init; }
    public bool Playable { get; init; }
}

public sealed class PotionSlotView
{
    public string PotionId { get; init; } = "";
    public string NameKey { get; init; } = "";
    public string DisplayName { get; init; } = "";
    public bool Available { get; init; }
}
