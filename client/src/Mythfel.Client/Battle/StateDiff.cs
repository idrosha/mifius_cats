using System.Text.Json.Serialization;

namespace Mythfel.Client.Battle;

/// <summary>
/// Server-authored battle presentation payload (§8.2 stateDiff out).
/// Numbers are authoritative; client never recomputes damage/rewards.
/// Shape mirrors battle snapshot + PlayerState fields needed by HUD §6.
/// </summary>
public sealed class StateDiff
{
    [JsonPropertyName("battleId")]
    public string BattleId { get; init; } = "";

    [JsonPropertyName("seq")]
    public int Seq { get; init; }

    [JsonPropertyName("turn")]
    public int Turn { get; init; }

    /// <summary>0 = P1, 1 = P2 (matches battle/internal/sim Side).</summary>
    [JsonPropertyName("active")]
    public int Active { get; init; }

    [JsonPropertyName("result")]
    public string Result { get; init; } = "";

    [JsonPropertyName("p1")]
    public PlayerDiff P1 { get; init; } = new();

    [JsonPropertyName("p2")]
    public PlayerDiff P2 { get; init; } = new();

    [JsonPropertyName("units")]
    public IReadOnlyList<UnitDiff> Units { get; init; } = Array.Empty<UnitDiff>();

    [JsonPropertyName("hand")]
    public IReadOnlyList<HandCardDiff> Hand { get; init; } = Array.Empty<HandCardDiff>();

    [JsonPropertyName("potionTray")]
    public IReadOnlyList<PotionSlotDiff> PotionTray { get; init; } = Array.Empty<PotionSlotDiff>();

    [JsonPropertyName("canKeep")]
    public bool CanKeep { get; init; }

    [JsonPropertyName("canEndTurn")]
    public bool CanEndTurn { get; init; } = true;
}

public sealed class PlayerDiff
{
    [JsonPropertyName("energy")]
    public int Energy { get; init; }

    [JsonPropertyName("milkDrops")]
    public int MilkDrops { get; init; }

    [JsonPropertyName("milkBursts")]
    public int MilkBursts { get; init; }

    [JsonPropertyName("keepCost")]
    public int KeepCost { get; init; }
}

public sealed class UnitDiff
{
    [JsonPropertyName("id")]
    public string Id { get; init; } = "";

    [JsonPropertyName("side")]
    public int Side { get; init; }

    [JsonPropertyName("lane")]
    public int Lane { get; init; }

    [JsonPropertyName("role")]
    public string Role { get; init; } = "";

    [JsonPropertyName("element")]
    public string Element { get; init; } = "";

    [JsonPropertyName("hp")]
    public int Hp { get; init; }

    [JsonPropertyName("maxHp")]
    public int MaxHp { get; init; }

    [JsonPropertyName("shield")]
    public int Shield { get; init; }

    [JsonPropertyName("alive")]
    public bool Alive { get; init; }

    [JsonPropertyName("statuses")]
    public IReadOnlyList<StatusDiff> Statuses { get; init; } = Array.Empty<StatusDiff>();

    [JsonPropertyName("handCount")]
    public int HandCount { get; init; }
}

public sealed class StatusDiff
{
    [JsonPropertyName("id")]
    public string Id { get; init; } = "";

    [JsonPropertyName("stacks")]
    public int Stacks { get; init; }

    [JsonPropertyName("duration")]
    public int Duration { get; init; }
}

public sealed class HandCardDiff
{
    [JsonPropertyName("unitId")]
    public string UnitId { get; init; } = "";

    [JsonPropertyName("handIndex")]
    public int HandIndex { get; init; }

    [JsonPropertyName("cardId")]
    public string CardId { get; init; } = "";

    [JsonPropertyName("name_key")]
    public string NameKey { get; init; } = "";

    [JsonPropertyName("cost")]
    public int Cost { get; init; }

    [JsonPropertyName("playable")]
    public bool Playable { get; init; }
}

public sealed class PotionSlotDiff
{
    [JsonPropertyName("potionId")]
    public string PotionId { get; init; } = "";

    [JsonPropertyName("name_key")]
    public string NameKey { get; init; } = "";

    [JsonPropertyName("available")]
    public bool Available { get; init; }
}
