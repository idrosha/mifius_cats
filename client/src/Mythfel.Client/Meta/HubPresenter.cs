using Mythfel.Client.Data;
using Mythfel.Client.LiveOps;
using Mythfel.Client.UI;

namespace Mythfel.Client.Meta;

/// <summary>
/// Hub presenter (§9 Game/Meta): tab navigation + feature-flag «Скоро» sheets + RU/EN switch.
/// No fake farm/clan-boss gameplay (§1 MUST NOT / skill client).
/// </summary>
public sealed class HubPresenter
{
    private static readonly (HubTabId Id, string NameKey)[] TabDefs =
    {
        (HubTabId.Yard, "hub.tab.yard"),
        (HubTabId.Pvp, "hub.tab.pvp"),
        (HubTabId.Collection, "hub.tab.collection"),
        (HubTabId.Shop, "hub.tab.shop"),
        (HubTabId.Clans, "hub.tab.clans"),
        (HubTabId.More, "hub.tab.more"),
    };

    private static readonly string[] LocaleCodes = { "ru", "en" };

    private readonly ILiveOpsSource _liveOps;
    private readonly ILocCatalog _loc;
    private readonly IHubView _view;

    public HubViewState State { get; private set; } = new();

    public HubPresenter(ILiveOpsSource liveOps, ILocCatalog loc, IHubView view)
    {
        _liveOps = liveOps ?? throw new ArgumentNullException(nameof(liveOps));
        _loc = loc ?? throw new ArgumentNullException(nameof(loc));
        _view = view ?? throw new ArgumentNullException(nameof(view));
    }

    public void Boot(HubTabId initial = HubTabId.Yard) => SelectTab(initial);

    public void SelectTab(HubTabId tab)
    {
        var flags = _liveOps.Current.FeatureFlags;
        SoonSheetId? soon = null;

        if (tab == HubTabId.Clans && !flags.ClanBossGameplay)
            soon = SoonSheetId.ClanBoss;

        State = BuildState(tab, soon);
        _view.Render(State);
    }

    /// <summary>
    /// Open a Soon sheet from Ещё (farm / nursery) when gameplay flags are off.
    /// </summary>
    public void OpenSoon(SoonSheetId sheet)
    {
        var flags = _liveOps.Current.FeatureFlags;
        var allowed = sheet switch
        {
            SoonSheetId.ClanBoss => !flags.ClanBossGameplay,
            SoonSheetId.Farm => !flags.FarmGameplay,
            SoonSheetId.Nursery => !flags.NurseryGameplay,
            _ => false,
        };

        if (!allowed)
            throw new InvalidOperationException($"Gameplay flag enabled for {sheet}; Soon sheet not used.");

        State = BuildState(HubTabId.More, sheet);
        _view.Render(State);
    }

    /// <summary>
    /// RU/EN переключение (§13.8). Re-resolves tab/Soon labels via <see cref="ILocCatalog"/>.
    /// </summary>
    public void SetLocale(string locale)
    {
        _loc.SetLocale(locale);
        State = BuildState(State.ActiveTab, State.ActiveSoonSheet);
        _view.Render(State);
    }

    private HubViewState BuildState(HubTabId active, SoonSheetId? soon)
    {
        var flags = _liveOps.Current.FeatureFlags;
        var tabs = new List<HubTabView>(TabDefs.Length);
        foreach (var (id, key) in TabDefs)
        {
            var isSoon = id == HubTabId.Clans && !flags.ClanBossGameplay;
            tabs.Add(new HubTabView
            {
                Id = id,
                NameKey = key,
                DisplayName = _loc.Resolve(key),
                IsSoon = isSoon,
            });
        }

        string? soonTitleKey = null;
        string? soonBodyKey = null;
        if (soon is { } sheet)
        {
            soonTitleKey = sheet switch
            {
                SoonSheetId.ClanBoss => "hub.soon.clan_boss.title",
                SoonSheetId.Farm => "hub.soon.farm.title",
                SoonSheetId.Nursery => "hub.soon.nursery.title",
                _ => "hub.soon.generic.title",
            };
            soonBodyKey = "hub.soon.body";
        }

        var localeOptions = new List<LocaleOptionView>(LocaleCodes.Length);
        foreach (var code in LocaleCodes)
        {
            var nameKey = $"locale.name.{code}";
            localeOptions.Add(new LocaleOptionView
            {
                Locale = code,
                NameKey = nameKey,
                DisplayName = _loc.Resolve(nameKey),
                IsActive = code == _loc.CurrentLocale,
            });
        }

        return new HubViewState
        {
            ActiveTab = active,
            Tabs = tabs,
            ActiveSoonSheet = soon,
            SoonTitleKey = soonTitleKey,
            SoonTitle = soonTitleKey is null ? null : _loc.Resolve(soonTitleKey),
            SoonBodyKey = soonBodyKey,
            SoonBody = soonBodyKey is null ? null : _loc.Resolve(soonBodyKey),
            CurrentLocale = _loc.CurrentLocale,
            LocaleOptions = localeOptions,
        };
    }
}
