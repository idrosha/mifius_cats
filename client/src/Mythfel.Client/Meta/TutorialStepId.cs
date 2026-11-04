namespace Mythfel.Client.Meta;

/// <summary>
/// Soft-launch tutorial steps (§13.1 / analytics <c>tutorial_step</c> §11).
/// Path only: starters → Двор battle → victory. No invented side quests.
/// </summary>
public enum TutorialStepId
{
    None = 0,
    Starters = 1,
    YardBattle = 2,
    Victory = 3,
    FailedOvertime = 4,
}
