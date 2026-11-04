using Mythfel.Client.Data;
using Mythfel.Client.LiveOps;
using Mythfel.Client.Meta;
using Mythfel.Client.UI;

namespace Mythfel.Client.Tests;

public class HubPresenterTests
{
    [Fact]
    public void Boot_renders_six_tabs_with_clans_marked_soon_when_flag_off()
    {
        var view = new CaptureHub();
        var presenter = new HubPresenter(new StubLiveOpsSource(), SampleLoc(), view);

        presenter.Boot();

        Assert.Equal(HubTabId.Yard, view.Last!.ActiveTab);
        Assert.Equal(6, view.Last.Tabs.Count);
        Assert.Equal(
            new[] { HubTabId.Yard, HubTabId.Pvp, HubTabId.Collection, HubTabId.Shop, HubTabId.Clans, HubTabId.More },
            view.Last.Tabs.Select(t => t.Id).ToArray());
        Assert.Equal("Двор", view.Last.Tabs[0].DisplayName);
        Assert.Equal("hub.tab.yard", view.Last.Tabs[0].NameKey);
        Assert.True(view.Last.Tabs.Single(t => t.Id == HubTabId.Clans).IsSoon);
        Assert.Null(view.Last.ActiveSoonSheet);
    }

    [Fact]
    public void SelectTab_Clans_opens_Soon_sheet_when_clan_boss_flag_off()
    {
        var view = new CaptureHub();
        var presenter = new HubPresenter(new StubLiveOpsSource(), SampleLoc(), view);
        presenter.Boot();

        presenter.SelectTab(HubTabId.Clans);

        Assert.Equal(HubTabId.Clans, view.Last!.ActiveTab);
        Assert.Equal(SoonSheetId.ClanBoss, view.Last.ActiveSoonSheet);
        Assert.Equal("hub.soon.clan_boss.title", view.Last.SoonTitleKey);
        Assert.Equal("Клан-босс", view.Last.SoonTitle);
        Assert.Equal("hub.soon.body", view.Last.SoonBodyKey);
        Assert.Equal("Скоро", view.Last.SoonBody);
    }

    [Fact]
    public void SelectTab_Shop_does_not_open_Soon()
    {
        var view = new CaptureHub();
        var presenter = new HubPresenter(new StubLiveOpsSource(), SampleLoc(), view);

        presenter.SelectTab(HubTabId.Shop);

        Assert.Equal(HubTabId.Shop, view.Last!.ActiveTab);
        Assert.Null(view.Last.ActiveSoonSheet);
        Assert.False(view.Last.Tabs.Single(t => t.Id == HubTabId.Shop).IsSoon);
    }

    [Fact]
    public void OpenSoon_Farm_from_More_when_farm_flag_off()
    {
        var view = new CaptureHub();
        var presenter = new HubPresenter(new StubLiveOpsSource(), SampleLoc(), view);
        presenter.Boot(HubTabId.More);

        presenter.OpenSoon(SoonSheetId.Farm);

        Assert.Equal(HubTabId.More, view.Last!.ActiveTab);
        Assert.Equal(SoonSheetId.Farm, view.Last.ActiveSoonSheet);
        Assert.Equal("hub.soon.farm.title", view.Last.SoonTitleKey);
    }

    [Fact]
    public void OpenSoon_throws_when_gameplay_flag_enabled()
    {
        var liveOps = new StubLiveOpsSource(new LiveOpsConfig
        {
            FeatureFlags = new FeatureFlagsConfig { FarmGameplay = true },
            Shop = StubLiveOpsSource.SoftLaunchDefaults().Shop,
        });
        var presenter = new HubPresenter(liveOps, SampleLoc(), new CaptureHub());

        Assert.Throws<InvalidOperationException>(() => presenter.OpenSoon(SoonSheetId.Farm));
    }

    [Fact]
    public void SelectTab_Clans_is_live_when_clan_boss_flag_on()
    {
        var liveOps = new StubLiveOpsSource(new LiveOpsConfig
        {
            FeatureFlags = new FeatureFlagsConfig { ClanBossGameplay = true },
            Shop = StubLiveOpsSource.SoftLaunchDefaults().Shop,
        });
        var view = new CaptureHub();
        var presenter = new HubPresenter(liveOps, SampleLoc(), view);

        presenter.SelectTab(HubTabId.Clans);

        Assert.Null(view.Last!.ActiveSoonSheet);
        Assert.False(view.Last.Tabs.Single(t => t.Id == HubTabId.Clans).IsSoon);
    }

    private static DictionaryLocCatalog SampleLoc() => new(new Dictionary<string, IReadOnlyDictionary<string, string>>
    {
        ["hub.tab.yard"] = Dict("Двор", "Yard"),
        ["hub.tab.pvp"] = Dict("PvP", "PvP"),
        ["hub.tab.collection"] = Dict("Коллекция", "Collection"),
        ["hub.tab.shop"] = Dict("Магазин", "Shop"),
        ["hub.tab.clans"] = Dict("Кланы", "Clans"),
        ["hub.tab.more"] = Dict("Ещё", "More"),
        ["hub.soon.clan_boss.title"] = Dict("Клан-босс", "Clan Boss"),
        ["hub.soon.farm.title"] = Dict("Ферма", "Farm"),
        ["hub.soon.nursery.title"] = Dict("Питомник", "Nursery"),
        ["hub.soon.body"] = Dict("Скоро", "Coming soon"),
        ["locale.name.ru"] = Dict("Русский", "Russian"),
        ["locale.name.en"] = Dict("English", "English"),
    });

    private static IReadOnlyDictionary<string, string> Dict(string ru, string en) =>
        new Dictionary<string, string> { ["ru"] = ru, ["en"] = en };

    private sealed class CaptureHub : IHubView
    {
        public HubViewState? Last { get; private set; }
        public void Render(HubViewState state) => Last = state;
    }
}
