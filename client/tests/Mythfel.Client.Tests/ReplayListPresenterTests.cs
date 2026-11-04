using Mythfel.Client.Battle;
using Mythfel.Client.Meta;
using Mythfel.Client.Net;
using Mythfel.Client.UI;

namespace Mythfel.Client.Tests;

public class ReplayListPresenterTests
{
    [Fact]
    public async Task BootAsync_binds_last_pvp_list_without_opening()
    {
        var view = new CaptureReplayView();
        var net = new StubBattleNetClient();
        net.SetReplayList(new[]
        {
            Item("b1", frames: 3),
            Item("b2", frames: 5),
        });
        var presenter = new ReplayListPresenter(net, view);

        await presenter.BootAsync();

        Assert.Equal(2, view.Last!.Items.Count);
        Assert.Equal("b1", view.Last.Items[0].BattleId);
        Assert.False(view.Last.IsOpen);
        Assert.Empty(view.Last.Frames);
    }

    [Fact]
    public async Task OpenAsync_GetReplay_opens_first_frame_readonly()
    {
        var view = new CaptureReplayView();
        var net = new StubBattleNetClient();
        net.SetReplayList(new[] { Item("pvp_open", frames: 2) });
        net.SetReplay("pvp_open", new[]
        {
            Frame(1, "battle_start"),
            Frame(2, "surrender"),
        });
        var presenter = new ReplayListPresenter(net, view);
        await presenter.BootAsync();

        await presenter.OpenAsync("pvp_open");

        Assert.True(view.Last!.IsOpen);
        Assert.Equal("pvp_open", view.Last.OpenedBattleId);
        Assert.Equal(2, view.Last.Frames.Count);
        Assert.Equal(0, view.Last.FrameIndex);
        Assert.Equal("battle_start", view.Last.CurrentFrame!.Note);
        Assert.Equal(1, view.Last.CurrentFrame.Seq);
    }

    [Fact]
    public async Task Seek_moves_to_server_frame_without_local_damage_math()
    {
        var view = new CaptureReplayView();
        var net = new StubBattleNetClient();
        net.SetReplay("pvp_seek", new[]
        {
            Frame(1, "battle_start"),
            Frame(2, "surrender"),
        });
        var presenter = new ReplayListPresenter(net, view);
        await presenter.OpenAsync("pvp_seek");

        presenter.Seek(1);

        Assert.Equal(1, view.Last!.FrameIndex);
        Assert.Equal("surrender", view.Last.CurrentFrame!.Note);
        Assert.Equal(2, view.Last.CurrentFrame.Seq);
    }

    [Fact]
    public async Task OpenAsync_missing_replay_throws()
    {
        var presenter = new ReplayListPresenter(new StubBattleNetClient(), new CaptureReplayView());
        await Assert.ThrowsAsync<InvalidOperationException>(() => presenter.OpenAsync("nope"));
    }

    private static ReplayListItem Item(string id, int frames) => new()
    {
        BattleId = id,
        MatchId = "m_" + id,
        Seed = 42,
        Result = "surrender",
        FrameCount = frames,
    };

    private static ReplayFrame Frame(int seq, string note) => new()
    {
        Seq = seq,
        Note = note,
        Snapshot = new Dictionary<string, object?>
        {
            ["turn"] = 1,
            ["result"] = note == "surrender" ? "surrender" : "",
        },
    };

    private sealed class CaptureReplayView : IReplayListView
    {
        public ReplayListViewState? Last { get; private set; }
        public void Render(ReplayListViewState state) => Last = state;
    }
}
