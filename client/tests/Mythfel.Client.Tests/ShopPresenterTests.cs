using Mythfel.Client.Data;
using Mythfel.Client.LiveOps;
using Mythfel.Client.Meta;
using Mythfel.Client.UI;

namespace Mythfel.Client.Tests;

public class ShopPresenterTests
{
    [Fact]
    public void BindFromLiveOps_empty_offers_renders_empty_shop()
    {
        var view = new CaptureShop();
        var presenter = new ShopPresenter(new StubLiveOpsSource(), SampleLoc(), view);

        presenter.BindFromLiveOps();

        Assert.True(view.Last!.IsEmpty);
        Assert.Empty(view.Last.Offers);
        Assert.Equal(
            new[] { "yarn", "gacha_jar", "pass", "battle_potion", "slot_expand" },
            view.Last.OfferKinds.ToArray());
    }

    [Fact]
    public void BindFromLiveOps_maps_known_offers_without_inventing_prices()
    {
        var liveOps = new StubLiveOpsSource(new LiveOpsConfig
        {
            Shop = new ShopConfig
            {
                OfferKinds = new[] { "yarn", "gacha_jar", "pass", "battle_potion", "slot_expand" },
                Offers = new[]
                {
                    new ShopOffer { OfferId = "offer_yarn_pack_a", Kind = "yarn" },
                    new ShopOffer { OfferId = "offer_pass_season", Kind = "pass" },
                },
            },
            FeatureFlags = StubLiveOpsSource.SoftLaunchDefaults().FeatureFlags,
        });
        var view = new CaptureShop();
        var presenter = new ShopPresenter(liveOps, SampleLoc(), view);

        presenter.BindFromLiveOps();

        Assert.False(view.Last!.IsEmpty);
        Assert.Equal(2, view.Last.Offers.Count);
        Assert.Equal("offer_yarn_pack_a", view.Last.Offers[0].OfferId);
        Assert.Equal("yarn", view.Last.Offers[0].Kind);
        Assert.Equal("shop.kind.yarn", view.Last.Offers[0].KindNameKey);
        Assert.Equal("Клубки", view.Last.Offers[0].KindDisplayName);
        Assert.Equal("pass", view.Last.Offers[1].Kind);
        // No price fields on view — SSOT shop offer schema has no client prices.
        Assert.Null(view.Last.Offers[0].GetType().GetProperty("Price"));
    }

    [Fact]
    public void BindFromLiveOps_skips_unknown_kind()
    {
        var liveOps = new StubLiveOpsSource(new LiveOpsConfig
        {
            Shop = new ShopConfig
            {
                OfferKinds = new[] { "yarn" },
                Offers = new[]
                {
                    new ShopOffer { OfferId = "bad", Kind = "crypto_nft" },
                    new ShopOffer { OfferId = "ok", Kind = "yarn" },
                },
            },
            FeatureFlags = StubLiveOpsSource.SoftLaunchDefaults().FeatureFlags,
        });
        var view = new CaptureShop();
        var presenter = new ShopPresenter(liveOps, SampleLoc(), view);

        presenter.BindFromLiveOps();

        Assert.Single(view.Last!.Offers);
        Assert.Equal("ok", view.Last.Offers[0].OfferId);
    }

    private static DictionaryLocCatalog SampleLoc() => new(new Dictionary<string, IReadOnlyDictionary<string, string>>
    {
        ["shop.kind.yarn"] = new Dictionary<string, string> { ["ru"] = "Клубки", ["en"] = "Yarn" },
        ["shop.kind.gacha_jar"] = new Dictionary<string, string> { ["ru"] = "Банки", ["en"] = "Jars" },
        ["shop.kind.pass"] = new Dictionary<string, string> { ["ru"] = "Пасс", ["en"] = "Pass" },
        ["shop.kind.battle_potion"] = new Dictionary<string, string> { ["ru"] = "Зелья", ["en"] = "Potions" },
        ["shop.kind.slot_expand"] = new Dictionary<string, string> { ["ru"] = "Слоты", ["en"] = "Slots" },
    });

    private sealed class CaptureShop : IShopView
    {
        public ShopViewState? Last { get; private set; }
        public void Render(ShopViewState state) => Last = state;
    }
}
