using Mythfel.Client.Battle;

namespace Mythfel.Client.Net;

/// <summary>
/// Thin battle-service client (§8.2 / §9 Game/Net). Stub until Nakama/RPC wiring.
/// </summary>
public interface IBattleNetClient
{
    /// <summary>CreatePvE — stageId, team, potions → first stateDiff (§8.2).</summary>
    Task<StateDiff> CreatePvEAsync(
        string stageId,
        IReadOnlyList<string> team,
        IReadOnlyList<string>? potions = null,
        CancellationToken ct = default);

    Task<StateDiff> SubmitActionAsync(string battleId, BattleAction action, CancellationToken ct = default);

    /// <summary>List last ≤10 PvP for local user (§3.6 / §6 ReplayList).</summary>
    Task<IReadOnlyList<ReplayListItem>> ListReplaysAsync(CancellationToken ct = default);

    /// <summary>GetReplay — battleId → frames (§8.2).</summary>
    Task<IReadOnlyList<ReplayFrame>> GetReplayAsync(string battleId, CancellationToken ct = default);
}
