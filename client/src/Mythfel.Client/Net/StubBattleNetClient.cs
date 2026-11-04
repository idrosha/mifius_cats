using Mythfel.Client.Battle;

namespace Mythfel.Client.Net;

/// <summary>
/// Test/dev stub: returns queued payloads. No local sim — mirrors server authority.
/// </summary>
public sealed class StubBattleNetClient : IBattleNetClient
{
    private readonly Queue<StateDiff> _responses = new();
    private readonly List<ReplayListItem> _replays = new();
    private readonly Dictionary<string, IReadOnlyList<ReplayFrame>> _framesByBattle = new();

    public string? LastCreatePvEStageId { get; private set; }
    public IReadOnlyList<string>? LastCreatePvETeam { get; private set; }

    public void Enqueue(StateDiff diff) => _responses.Enqueue(diff);

    public void SetReplayList(IEnumerable<ReplayListItem> items)
    {
        _replays.Clear();
        _replays.AddRange(items);
    }

    public void SetReplay(string battleId, IReadOnlyList<ReplayFrame> frames) =>
        _framesByBattle[battleId] = frames;

    public Task<StateDiff> CreatePvEAsync(
        string stageId,
        IReadOnlyList<string> team,
        IReadOnlyList<string>? potions = null,
        CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(stageId))
            throw new ArgumentException("stageId required", nameof(stageId));
        if (team is null || team.Count == 0)
            throw new ArgumentException("team required", nameof(team));

        LastCreatePvEStageId = stageId;
        LastCreatePvETeam = team.ToList();
        _ = potions;

        if (_responses.Count == 0)
        {
            throw new InvalidOperationException(
                "StubBattleNetClient has no queued stateDiff; enqueue server payloads only.");
        }

        return Task.FromResult(_responses.Dequeue());
    }

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

    public Task<IReadOnlyList<ReplayListItem>> ListReplaysAsync(CancellationToken ct = default)
    {
        IReadOnlyList<ReplayListItem> list = _replays.ToList();
        return Task.FromResult(list);
    }

    public Task<IReadOnlyList<ReplayFrame>> GetReplayAsync(string battleId, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(battleId) || !_framesByBattle.TryGetValue(battleId, out var frames))
        {
            throw new InvalidOperationException($"replay not found: {battleId}");
        }

        return Task.FromResult(frames);
    }
}
