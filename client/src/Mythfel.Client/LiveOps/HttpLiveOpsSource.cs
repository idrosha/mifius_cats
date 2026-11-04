using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Mythfel.Client.LiveOps;

/// <summary>
/// Fetches versioned LiveOps JSON from CDN / local stub (§8.4 / ЗАПУСК :8090).
/// Combat numbers stay server-authoritative; client uses shop + feature_flags only.
/// Signature check accepts stub alg only — production keys never in repo.
/// </summary>
public sealed class HttpLiveOpsSource : ILiveOpsSource
{
    public const string DefaultLocalCdnPath = "/v1/liveops.json";
    public const string StubSignatureAlg = "stub";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public LiveOpsConfig Current { get; private set; }
    public string? RemoteVersion { get; private set; }
    public string? SignatureAlg { get; private set; }

    public HttpLiveOpsSource(LiveOpsConfig config)
    {
        Current = config ?? throw new ArgumentNullException(nameof(config));
    }

    /// <summary>Boot → LiveOps fetch (§6). Optional region for soft-launch geo gate.</summary>
    public static async Task<HttpLiveOpsSource> FetchAsync(
        HttpClient http,
        Uri liveOpsUrl,
        string? clientRegion = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(http);
        ArgumentNullException.ThrowIfNull(liveOpsUrl);

        using var req = new HttpRequestMessage(HttpMethod.Get, liveOpsUrl);
        req.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        if (!string.IsNullOrWhiteSpace(clientRegion))
        {
            req.Headers.TryAddWithoutValidation("X-Client-Region", clientRegion.Trim().ToUpperInvariant());
        }

        using var resp = await http.SendAsync(req, cancellationToken).ConfigureAwait(false);
        if (resp.StatusCode == System.Net.HttpStatusCode.Forbidden)
        {
            throw new SoftLaunchGeoDeniedException(clientRegion ?? "");
        }
        resp.EnsureSuccessStatusCode();

        var alg = Header(resp, "X-LiveOps-Signature-Alg") ?? StubSignatureAlg;
        var sig = Header(resp, "X-LiveOps-Signature");
        if (!string.Equals(alg, StubSignatureAlg, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"LiveOps signature alg {alg} not supported in-repo; production verify is out of tree.");
        }
        if (string.IsNullOrWhiteSpace(sig))
        {
            throw new InvalidOperationException("LiveOps response missing X-LiveOps-Signature (stub expects non-empty).");
        }

        await using var stream = await resp.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);
        var wire = await JsonSerializer.DeserializeAsync<WireDoc>(stream, JsonOptions, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new InvalidOperationException("LiveOps JSON empty");

        var config = Map(wire);
        return new HttpLiveOpsSource(config)
        {
            RemoteVersion = Header(resp, "X-LiveOps-Version") ?? config.Version,
            SignatureAlg = alg,
        };
    }

    /// <summary>Parse body without HTTP (unit tests / offline mirror).</summary>
    public static LiveOpsConfig ParseJson(string json)
    {
        var wire = JsonSerializer.Deserialize<WireDoc>(json, JsonOptions)
            ?? throw new InvalidOperationException("LiveOps JSON empty");
        return Map(wire);
    }

    private static LiveOpsConfig Map(WireDoc wire) => new()
    {
        Version = string.IsNullOrWhiteSpace(wire.Version) ? "1" : wire.Version!,
        Shop = new ShopConfig
        {
            OfferKinds = wire.Shop?.OfferKinds ?? Array.Empty<string>(),
            Offers = (wire.Shop?.Offers ?? Array.Empty<WireOffer>())
                .Select(o => new ShopOffer
                {
                    OfferId = o.OfferId ?? "",
                    Kind = o.Kind ?? "",
                    CardId = o.CardId,
                    PartId = o.PartId,
                    TemplateId = o.TemplateId,
                    StageId = o.StageId,
                })
                .ToArray(),
        },
        FeatureFlags = new FeatureFlagsConfig
        {
            ClanBossGameplay = wire.FeatureFlags?.ClanBossGameplay ?? false,
            FarmGameplay = wire.FeatureFlags?.FarmGameplay ?? false,
            NurseryGameplay = wire.FeatureFlags?.NurseryGameplay ?? false,
            ArenaSoftCapRarity = wire.FeatureFlags?.ArenaSoftCapRarity ?? false,
        },
    };

    private static string? Header(HttpResponseMessage resp, string name) =>
        resp.Headers.TryGetValues(name, out var values) ? values.FirstOrDefault() : null;

    private sealed class WireDoc
    {
        [JsonPropertyName("version")] public string? Version { get; set; }
        [JsonPropertyName("shop")] public WireShop? Shop { get; set; }
        [JsonPropertyName("feature_flags")] public WireFlags? FeatureFlags { get; set; }
    }

    private sealed class WireShop
    {
        [JsonPropertyName("offer_kinds")] public string[]? OfferKinds { get; set; }
        [JsonPropertyName("offers")] public WireOffer[]? Offers { get; set; }
    }

    private sealed class WireOffer
    {
        [JsonPropertyName("offer_id")] public string? OfferId { get; set; }
        [JsonPropertyName("kind")] public string? Kind { get; set; }
        [JsonPropertyName("card_id")] public string? CardId { get; set; }
        [JsonPropertyName("part_id")] public string? PartId { get; set; }
        [JsonPropertyName("template_id")] public string? TemplateId { get; set; }
        [JsonPropertyName("stage_id")] public string? StageId { get; set; }
    }

    private sealed class WireFlags
    {
        [JsonPropertyName("clan_boss_gameplay")] public bool ClanBossGameplay { get; set; }
        [JsonPropertyName("farm_gameplay")] public bool FarmGameplay { get; set; }
        [JsonPropertyName("nursery_gameplay")] public bool NurseryGameplay { get; set; }
        [JsonPropertyName("arena_soft_cap_rarity")] public bool ArenaSoftCapRarity { get; set; }
    }
}

/// <summary>CDN geo gate denied — emit analytics <c>soft_launch_flag</c> (§11) as blocked.</summary>
public sealed class SoftLaunchGeoDeniedException : Exception
{
    public SoftLaunchGeoDeniedException(string region)
        : base($"soft launch geo denied for region '{region}'")
    {
        Region = region;
    }

    public string Region { get; }
}
