using Mythfel.Client.Meta;

namespace Mythfel.Client.UI;

/// <summary>
/// ReplayList (§6): last 10 PvP + opened frame playback shell.
/// </summary>
public interface IReplayListView
{
    void Render(ReplayListViewState state);
}
