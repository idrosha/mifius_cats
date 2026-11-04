using Mythfel.Client.Battle;

namespace Mythfel.Client.Meta;

/// <summary>
/// ReplayList screen (§6 item 11): up to 10 PvP + opened frames (§13.6).
/// </summary>
public sealed class ReplayListViewState
{
    public IReadOnlyList<ReplayListItem> Items { get; init; } = Array.Empty<ReplayListItem>();

    /// <summary>True after successful GetReplay open.</summary>
    public bool IsOpen { get; init; }

    public string OpenedBattleId { get; init; } = "";

    public IReadOnlyList<ReplayFrame> Frames { get; init; } = Array.Empty<ReplayFrame>();

    public int FrameIndex { get; init; }

    public ReplayFrame? CurrentFrame =>
        Frames.Count == 0 || FrameIndex < 0 || FrameIndex >= Frames.Count
            ? null
            : Frames[FrameIndex];
}
