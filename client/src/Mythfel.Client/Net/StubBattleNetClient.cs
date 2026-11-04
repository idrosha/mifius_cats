using Mythfel.Client.Battle;

namespace Mythfel.Client.Net;

/// <summary>
/// Test/dev stub: returns a queued stateDiff. No local sim — mirrors server authority.
/// </summary>
public sealed class StubBattleNetClient : IBattleNetClient
{
    private readonly Queue<StateDiff> _responses = new();

    public void Enqueue(StateDiff diff) => _responses.Enqueue(diff);

    public Task<StateDiff> SubmitActionAsync(string battleId, BattleAction action, CancellationToken ct = default)
    {
        if (_responses.Count == 0)
        {
            throw new InvalidOperationException(
                "StubBattleNetClient has no queued stateDiff; enqueue server payloads only.");
        }

        var next = _responses.Dequeue();
        if (!string.IsNullOrEmpty(battleId) &&
            !string.IsNullOrEmpty(next.BattleId) &&
            next.BattleId != battleId)
        {
            throw new InvalidOperationException($"battleId mismatch: sent {battleId}, got {next.BattleId}");
        }

        _ = action;
        return Task.FromResult(next);
    }
}
