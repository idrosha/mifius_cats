using Mythfel.Client.Data;
using Mythfel.Client.LiveOps;
using Mythfel.Client.UI;

namespace Mythfel.Client.Meta;

/// <summary>
/// Shop presenter (§9 Game/Meta / §6 Shop): binds LiveOps offers only.
/// No invented prices — empty offers from LiveOps → empty UI (§7.4 shop.offers).
/// Purchases are server-validated later (§8.3); this slice is display-only.
/// </summary>
public sealed class ShopPresenter
{
    private static readonly HashSet<string> KnownKinds = new(StringComparer.Ordinal)
    {
        "yarn",
        "gacha_jar",
        "pass",
        "battle_potion",
        "slot_expand",
    };

    private readonly ILiveOpsSource _liveOps;
    private readonly ILocCatalog _loc;
    private readonly IShopView _view;

    public ShopViewState State { get; private set; } = new();

    public ShopPresenter(ILiveOpsSource liveOps, ILocCatalog loc, IShopView view)
    {
        _liveOps = liveOps ?? throw new ArgumentNullException(nameof(liveOps));
        _loc = loc ?? throw new ArgumentNullException(nameof(loc));
        _view = view ?? throw new ArgumentNullException(nameof(view));
    }

    public void BindFromLiveOps()
    {
        var shop = _liveOps.Current.Shop;
        var offers = new List<ShopOfferView>(shop.Offers.Count);

        foreach (var o in shop.Offers)
        {
            if (!KnownKinds.Contains(o.Kind))
                continue; // skip unknown kinds; never invent SKUs

            var kindKey = $"shop.kind.{o.Kind}";
            offers.Add(new ShopOfferView
            {
                OfferId = o.OfferId,
                Kind = o.Kind,
                KindNameKey = kindKey,
                KindDisplayName = _loc.Resolve(kindKey),
                CardId = o.CardId,
                PartId = o.PartId,
                TemplateId = o.TemplateId,
                StageId = o.StageId,
            });
        }

        State = new ShopViewState
        {
            OfferKinds = shop.OfferKinds.ToList(),
            Offers = offers,
        };
        _view.Render(State);
    }
}
