using Mythfel.Client.Data;
using Mythfel.Client.LiveOps;
using Mythfel.Client.Meta;
using Mythfel.Client.UI;

namespace Mythfel.Client.Tests;

public class LocaleSwitchTests
{
    [Fact]
    public void SetLocale_switches_hub_tab_labels_ru_to_en()
    {
        var view = new CaptureHub();
        var loc = SampleLoc();
        var presenter = new HubPresenter(new StubLiveOpsSource(), loc, view);
        presenter.Boot();

        Assert.Equal("ru", view.Last!.CurrentLocale);
        Assert.Equal("Двор", view.Last.Tabs[0].DisplayName);
        Assert.Equal(2, view.Last.LocaleOptions.Count);
        Assert.True(view.Last.LocaleOptions.Single(o => o.Locale == "ru").IsActive);

        presenter.SetLocale("en");

        Assert.Equal("en", view.Last!.CurrentLocale);
        Assert.Equal("Yard", view.Last.Tabs[0].DisplayName);
        Assert.Equal("Collection", view.Last.Tabs[2].DisplayName);
        Assert.Equal("en", loc.CurrentLocale);
        Assert.True(view.Last.LocaleOptions.Single(o => o.Locale == "en").IsActive);
        Assert.False(view.Last.LocaleOptions.Single(o => o.Locale == "ru").IsActive);
    }

    [Fact]
    public void SetLocale_rejects_unknown_locale()
    {
        var presenter = new HubPresenter(new StubLiveOpsSource(), SampleLoc(), new CaptureHub());
        presenter.Boot();

        Assert.Throws<ArgumentOutOfRangeException>(() => presenter.SetLocale("de"));
    }

    [Fact]
    public void SetLocale_re_resolves_Soon_sheet_labels()
    {
        var view = new CaptureHub();
        var presenter = new HubPresenter(new StubLiveOpsSource(), SampleLoc(), view);
        presenter.Boot();
        presenter.SelectTab(HubTabId.Clans);
        Assert.Equal("Клан-босс", view.Last!.SoonTitle);
        Assert.Equal("Скоро", view.Last.SoonBody);

        presenter.SetLocale("en");

        Assert.Equal(SoonSheetId.ClanBoss, view.Last!.ActiveSoonSheet);
        Assert.Equal("Clan Boss", view.Last.SoonTitle);
        Assert.Equal("Coming soon", view.Last.SoonBody);
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
