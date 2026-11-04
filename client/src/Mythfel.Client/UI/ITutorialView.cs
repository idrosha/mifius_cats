using Mythfel.Client.Meta;

namespace Mythfel.Client.UI;

/// <summary>
/// Tutorial shell (§13.1): step prompt only — battle HUD stays <see cref="IBattleHudView"/>.
/// </summary>
public interface ITutorialView
{
    void Render(TutorialViewState state);
}
