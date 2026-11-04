namespace Mythfel.Client.LiveOps;

/// <summary>
/// Mirrors liveops/config/v1/liveops.json shop + feature_flags defaults (empty offers).
/// </summary>
public sealed class StubLiveOpsSource : ILiveOpsSource
{
    public StubLiveOpsSource(LiveOpsConfig? config = null)
    {
        Current = config ?? SoftLaunchDefaults();
    }

    public LiveOpsConfig Current { get; }

    public static LiveOpsConfig SoftLaunchDefaults() => new()
    {
        Version = "1",
        Shop = new ShopConfig
        {
            OfferKinds = new[] { "yarn", "gacha_jar", "pass", "battle_potion", "slot_expand" },
            Offers = Array.Empty<ShopOffer>(),
        },
        FeatureFlags = new FeatureFlagsConfig
        {
            ClanBossGameplay = false,
            FarmGameplay = false,
            NurseryGameplay = false,
            ArenaSoftCapRarity = false,
        },
    };
}
