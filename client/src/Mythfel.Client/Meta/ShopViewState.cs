namespace Mythfel.Client.Meta;

public sealed class ShopViewState
{
    public IReadOnlyList<string> OfferKinds { get; init; } = Array.Empty<string>();
    public IReadOnlyList<ShopOfferView> Offers { get; init; } = Array.Empty<ShopOfferView>();
    public bool IsEmpty => Offers.Count == 0;
}

public sealed class ShopOfferView
{
    public string OfferId { get; init; } = "";
    public string Kind { get; init; } = "";
    public string KindNameKey { get; init; } = "";
    public string KindDisplayName { get; init; } = "";
    public string? CardId { get; init; }
    public string? PartId { get; init; }
    public string? TemplateId { get; init; }
    public string? StageId { get; init; }
}
