using System.Text.Json.Serialization;

namespace Mythfel.Client.Battle;

/// <summary>
/// Server replay frame (§8.2 GetReplay out / battle sim.Frame).
/// </summary>
public sealed class ReplayFrame
{
    [JsonPropertyName("seq")]
    public int Seq { get; init; }

    [JsonPropertyName("note")]
    public string Note { get; init; } = "";

    [JsonPropertyName("action")]
    public ReplayAction? Action { get; init; }

    /// <summary>Authoritative snapshot fields from server (turn/active/result/units).</summary>
    [JsonPropertyName("snapshot")]
    public IReadOnlyDictionary<string, object?> Snapshot { get; init; } =
        new Dictionary<string, object?>();
}

public sealed class ReplayAction
{
    [JsonPropertyName("kind")]
    public string Kind { get; init; } = "";

    [JsonPropertyName("unitId")]
    public string UnitId { get; init; } = "";

    [JsonPropertyName("handIndex")]
    public int HandIndex { get; init; }

    [JsonPropertyName("targetId")]
    public string TargetId { get; init; } = "";

    [JsonPropertyName("potionId")]
    public string PotionId { get; init; } = "";
}

/// <summary>ReplayList row (§6 item 11 / §3.6 last 10 PvP).</summary>
public sealed class ReplayListItem
{
    [JsonPropertyName("battleId")]
    public string BattleId { get; init; } = "";

    [JsonPropertyName("matchId")]
    public string MatchId { get; init; } = "";

    [JsonPropertyName("seed")]
    public long Seed { get; init; }

    [JsonPropertyName("result")]
    public string Result { get; init; } = "";

    [JsonPropertyName("frameCount")]
    public int FrameCount { get; init; }
}
