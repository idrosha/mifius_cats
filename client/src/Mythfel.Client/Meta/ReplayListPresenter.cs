using Mythfel.Client.Battle;
using Mythfel.Client.Net;
using Mythfel.Client.UI;

namespace Mythfel.Client.Meta;

/// <summary>
/// ReplayList presenter (§6 / §13.6): list last 10 PvP, open via GetReplay frames.
/// Read-only — no local combat math (§3.6).
/// </summary>
public sealed class ReplayListPresenter
{
    private readonly IBattleNetClient _net;
    private readonly IReplayListView _view;

    public ReplayListViewState State { get; private set; } = new();

    public ReplayListPresenter(IBattleNetClient net, IReplayListView view)
    {
        _net = net ?? throw new ArgumentNullException(nameof(net));
        _view = view ?? throw new ArgumentNullException(nameof(view));
    }

    public async Task BootAsync(CancellationToken ct = default)
    {
        var items = await _net.ListReplaysAsync(ct).ConfigureAwait(false);
        State = new ReplayListViewState
        {
            Items = items,
            IsOpen = false,
            Frames = Array.Empty<ReplayFrame>(),
        };
        _view.Render(State);
    }

    /// <summary>Open PvP replay — GetReplay(battleId) → frames (§8.2 / §13.6).</summary>
    public async Task OpenAsync(string battleId, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(battleId))
            throw new ArgumentException("battleId required", nameof(battleId));

        var frames = await _net.GetReplayAsync(battleId, ct).ConfigureAwait(false);
        if (frames.Count == 0)
            throw new InvalidOperationException($"GetReplay returned empty frames for {battleId}");

        State = new ReplayListViewState
        {
            Items = State.Items,
            IsOpen = true,
            OpenedBattleId = battleId,
            Frames = frames,
            FrameIndex = 0,
        };
        _view.Render(State);
    }

    public void Seek(int frameIndex)
    {
        if (!State.IsOpen)
            throw new InvalidOperationException("no replay open");
        if (frameIndex < 0 || frameIndex >= State.Frames.Count)
            throw new ArgumentOutOfRangeException(nameof(frameIndex));

        State = new ReplayListViewState
        {
            Items = State.Items,
            IsOpen = true,
            OpenedBattleId = State.OpenedBattleId,
            Frames = State.Frames,
            FrameIndex = frameIndex,
        };
        _view.Render(State);
    }

    public void Close()
    {
        State = new ReplayListViewState
        {
            Items = State.Items,
            IsOpen = false,
            Frames = Array.Empty<ReplayFrame>(),
        };
        _view.Render(State);
    }
}
