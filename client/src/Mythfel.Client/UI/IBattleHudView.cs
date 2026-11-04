using Mythfel.Client.Battle;

namespace Mythfel.Client.UI;

/// <summary>
/// Battle HUD contract (§6): board 3+3, hand, energy, milk, keep, end turn, potion tray.
/// Unity MonoBehaviour implements this later; presenter stays engine-agnostic.
/// </summary>
public interface IBattleHudView
{
    void Render(BattleViewState state);
}
