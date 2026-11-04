using System.Net;
using System.Text;
using Mythfel.Client.LiveOps;

namespace Mythfel.Client.Tests;

public class HttpLiveOpsSourceTests
{
    private const string SampleJson = """
        {
          "version": "1",
          "shop": {
            "offer_kinds": ["yarn", "gacha_jar", "pass", "battle_potion", "slot_expand"],
            "offers": []
          },
          "feature_flags": {
            "clan_boss_gameplay": false,
            "farm_gameplay": false,
            "nursery_gameplay": false,
            "arena_soft_cap_rarity": false
          }
        }
        """;

    [Fact]
    public void ParseJson_MapsShopAndFlags()
    {
        var cfg = HttpLiveOpsSource.ParseJson(SampleJson);
        Assert.Equal("1", cfg.Version);
        Assert.Contains("yarn", cfg.Shop.OfferKinds);
        Assert.Empty(cfg.Shop.Offers);
        Assert.False(cfg.FeatureFlags.ClanBossGameplay);
        Assert.False(cfg.FeatureFlags.FarmGameplay);
        Assert.False(cfg.FeatureFlags.NurseryGameplay);
    }

    [Fact]
    public async Task FetchAsync_ReadsStubHeaders()
    {
        var handler = new StubHandler((req) =>
        {
            Assert.Equal("RU", req.Headers.GetValues("X-Client-Region").Single());
            var resp = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(SampleJson, Encoding.UTF8, "application/json"),
            };
            resp.Headers.TryAddWithoutValidation("X-LiveOps-Version", "1");
            resp.Headers.TryAddWithoutValidation("X-LiveOps-Signature", "stub");
            resp.Headers.TryAddWithoutValidation("X-LiveOps-Signature-Alg", "stub");
            return resp;
        });
        using var http = new HttpClient(handler);
        var src = await HttpLiveOpsSource.FetchAsync(
            http,
            new Uri("http://localhost:8090/v1/liveops.json"),
            clientRegion: "ru");
        Assert.Equal("1", src.RemoteVersion);
        Assert.Equal("stub", src.SignatureAlg);
        Assert.False(src.Current.FeatureFlags.ClanBossGameplay);
    }

    [Fact]
    public async Task FetchAsync_Forbidden_ThrowsGeoDenied()
    {
        var handler = new StubHandler(_ => new HttpResponseMessage(HttpStatusCode.Forbidden)
        {
            Content = new StringContent("""{"error":"soft_launch_geo_denied"}"""),
        });
        using var http = new HttpClient(handler);
        await Assert.ThrowsAsync<SoftLaunchGeoDeniedException>(() =>
            HttpLiveOpsSource.FetchAsync(http, new Uri("http://localhost:8090/v1/liveops.json"), "US"));
    }

    private sealed class StubHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _respond;

        public StubHandler(Func<HttpRequestMessage, HttpResponseMessage> respond) => _respond = respond;

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            Task.FromResult(_respond(request));
    }
}
