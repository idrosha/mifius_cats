using Mythfel.Client.LiveOps;

namespace Mythfel.Client.Meta;

/// <summary>Minimal analytics sink for §11 events (soft_launch_flag, etc.).</summary>
public interface IAnalytics
{
    void Track(string eventName, IReadOnlyDictionary<string, string>? props = null);
}

/// <summary>In-memory recorder for tests / device-smoke harness.</summary>
public sealed class RecordingAnalytics : IAnalytics
{
    private readonly List<(string Name, IReadOnlyDictionary<string, string> Props)> _events = new();

    public IReadOnlyList<(string Name, IReadOnlyDictionary<string, string> Props)> Events => _events;

    public void Track(string eventName, IReadOnlyDictionary<string, string>? props = null)
    {
        _events.Add((eventName, props ?? new Dictionary<string, string>()));
    }
}

/// <summary>Boot helper: evaluate geo → emit <c>soft_launch_flag</c> (§11 / §14).</summary>
public static class SoftLaunchBootstrap
{
    public static bool TryEnter(
        IAnalytics analytics,
        string? clientRegion,
        IReadOnlyList<string> geoAllowlist)
    {
        var allowed = SoftLaunchGeo.IsRegionAllowed(clientRegion, geoAllowlist);
        analytics.Track(SoftLaunchGeo.SoftLaunchFlagEvent, new Dictionary<string, string>
        {
            ["region"] = (clientRegion ?? "").Trim().ToUpperInvariant(),
            ["allowed"] = allowed ? "1" : "0",
        });
        return allowed;
    }
}
