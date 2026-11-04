using Mythfel.Client.Battle;

namespace Mythfel.Client.Net;

/// <summary>
/// Thin battle-service client (§8.2 / §9 Game/Net). Stub until Nakama/RPC wiring.
/// </summary>
public interface IBattleNetClient
{
    Task<StateDiff> SubmitActionAsync(string battleId, BattleAction action, CancellationToken ct = default);
}
