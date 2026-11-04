namespace Mythfel.Client.LiveOps;

/// <summary>
/// Phase 4 limited-geo gate (§14). Ops allowlist of ISO 3166-1 alpha-2; not store credentials.
/// </summary>
public static class SoftLaunchGeo
{
    /// <summary>§11 analytics event when soft-launch eligibility is evaluated.</summary>
    public const string SoftLaunchFlagEvent = "soft_launch_flag";

    public static bool IsRegionAllowed(string? regionIso3166, IReadOnlyList<string> allowlist)
    {
        if (allowlist == null || allowlist.Count == 0)
        {
            return false;
        }
        var want = Normalize(regionIso3166);
        if (want.Length != 2)
        {
            return false;
        }
        foreach (var r in allowlist)
        {
            if (Normalize(r) == want)
            {
                return true;
            }
        }
        return false;
    }

    public static IReadOnlyList<string> NormalizeAllowlist(IEnumerable<string> regions)
    {
        var list = new List<string>();
        var seen = new HashSet<string>(StringComparer.Ordinal);
        foreach (var r in regions)
        {
            var n = Normalize(r);
            if (n.Length != 2 || !n.All(static c => c is >= 'A' and <= 'Z'))
            {
                throw new ArgumentException($"soft launch geo: want ISO alpha-2, got '{r}'", nameof(regions));
            }
            if (seen.Add(n))
            {
                list.Add(n);
            }
        }
        if (list.Count == 0)
        {
            throw new ArgumentException("soft launch geo allowlist empty", nameof(regions));
        }
        return list;
    }

    private static string Normalize(string? region) =>
        (region ?? "").Trim().ToUpperInvariant();
}
