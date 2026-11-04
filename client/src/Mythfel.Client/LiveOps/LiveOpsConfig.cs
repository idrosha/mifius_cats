namespace Mythfel.Client.LiveOps;

/// <summary>
/// Client mirror of LiveOps remote JSON (§7.4 / §8.4) — shop + feature_flags for hub/meta.
/// Combat numbers remain server-authoritative; this is presentation/config only.
/// </summary>
public sealed class LiveOpsConfig
{
    public string Version { get; init; } = "1";
    public ShopConfig Shop { get; init; } = new();
    public FeatureFlagsConfig FeatureFlags { get; init; } = new();
}

public sealed class ShopConfig
{
    /// <summary>§5 / §2.5 / §6 — yarn, gacha_jar, pass, battle_potion, slot_expand.</summary>
    public IReadOnlyList<string> OfferKinds { get; init; } = Array.Empty<string>();

    /// <summary>Empty until LiveOps priced catalog; do not invent client-side SKUs/prices.</summary>
    public IReadOnlyList<ShopOffer> Offers { get; init; } = Array.Empty<ShopOffer>();
}

public sealed class ShopOffer
{
    public string OfferId { get; init; } = "";
    public string Kind { get; init; } = "";
    public string? CardId { get; init; }
    public string? PartId { get; init; }
    public string? TemplateId { get; init; }
    public string? StageId { get; init; }
}

public sealed class FeatureFlagsConfig
{
    /// <summary>§1 MUST NOT on SL — Clan boss is Soon tab when false.</summary>
    public bool ClanBossGameplay { get; init; }

    /// <summary>§1 MUST NOT on SL — Farm is Soon when false.</summary>
    public bool FarmGameplay { get; init; }

    /// <summary>§1 MUST NOT on SL — Nursery is Soon when false.</summary>
    public bool NurseryGameplay { get; init; }

    public bool ArenaSoftCapRarity { get; init; }
}
