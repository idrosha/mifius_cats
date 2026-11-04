namespace Mythfel.Client.LiveOps;

/// <summary>
/// Loads signed LiveOps JSON (§8.4). Stub for SL slice; CDN later.
/// </summary>
public interface ILiveOpsSource
{
    LiveOpsConfig Current { get; }
}
