using Mythfel.Client.Meta;

namespace Mythfel.Client.UI;

/// <summary>
/// Shop screen (§6): yarn, jars, pass, potions — offers from LiveOps only.
/// </summary>
public interface IShopView
{
    void Render(ShopViewState state);
}
