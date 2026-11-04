using Mythfel.Client.Meta;

namespace Mythfel.Client.UI;

/// <summary>
/// Hub shell (§6): tab bar + optional Soon sheet.
/// </summary>
public interface IHubView
{
    void Render(HubViewState state);
}
