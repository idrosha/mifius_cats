namespace Mythfel.Client.Battle;

/// <summary>
/// Client → server input (§8.2 SubmitAction). No combat resolution here.
/// </summary>
public sealed class BattleAction
{
    public string Kind { get; init; } = "";
    public string? UnitId { get; init; }
    public int? HandIndex { get; init; }
    public string? TargetId { get; init; }
    public string? PotionId { get; init; }

    public static BattleAction PlayCard(string unitId, int handIndex, string? targetId = null) =>
        new() { Kind = "playCard", UnitId = unitId, HandIndex = handIndex, TargetId = targetId };

    public static BattleAction Keep(string unitId, int handIndex) =>
        new() { Kind = "keep", UnitId = unitId, HandIndex = handIndex };

    public static BattleAction Potion(string potionId) =>
        new() { Kind = "potion", PotionId = potionId };

    public static BattleAction EndTurn() => new() { Kind = "endTurn" };

    public static BattleAction Surrender() => new() { Kind = "surrender" };
}
