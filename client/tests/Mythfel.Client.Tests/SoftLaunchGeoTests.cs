using Mythfel.Client.LiveOps;
using Mythfel.Client.Meta;

namespace Mythfel.Client.Tests;

public class SoftLaunchGeoTests
{
    [Fact]
    public void IsRegionAllowed_MatchesAllowlist()
    {
        var allow = SoftLaunchGeo.NormalizeAllowlist(new[] { "ru", "BY", "KZ" });
        Assert.True(SoftLaunchGeo.IsRegionAllowed("RU", allow));
        Assert.True(SoftLaunchGeo.IsRegionAllowed("by", allow));
        Assert.False(SoftLaunchGeo.IsRegionAllowed("US", allow));
        Assert.False(SoftLaunchGeo.IsRegionAllowed("", allow));
    }

    [Fact]
    public void NormalizeAllowlist_RejectsBadCodes()
    {
        Assert.Throws<ArgumentException>(() => SoftLaunchGeo.NormalizeAllowlist(new[] { "RUS" }));
        Assert.Throws<ArgumentException>(() => SoftLaunchGeo.NormalizeAllowlist(Array.Empty<string>()));
    }

    [Fact]
    public void SoftLaunchBootstrap_EmitsSoftLaunchFlag()
    {
        var analytics = new RecordingAnalytics();
        var allow = SoftLaunchGeo.NormalizeAllowlist(new[] { "RU", "BY" });
        Assert.True(SoftLaunchBootstrap.TryEnter(analytics, "ru", allow));
        Assert.False(SoftLaunchBootstrap.TryEnter(analytics, "US", allow));
        Assert.Equal(2, analytics.Events.Count);
        Assert.All(analytics.Events, e => Assert.Equal(SoftLaunchGeo.SoftLaunchFlagEvent, e.Name));
        Assert.Equal("1", analytics.Events[0].Props["allowed"]);
        Assert.Equal("0", analytics.Events[1].Props["allowed"]);
    }
}
