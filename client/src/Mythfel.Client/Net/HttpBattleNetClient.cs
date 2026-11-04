using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Mythfel.Client.Battle;

namespace Mythfel.Client.Net;

/// <summary>
/// Local battle-service client against <c>battle/cmd/devapi</c> (§8.2).
/// Dev/smoke only — no auth, no production secrets.
/// </summary>
public sealed class HttpBattleNetClient : IBattleNetClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly HttpClient _http;
    private readonly string _userId;

    public HttpBattleNetClient(HttpClient http, string userId = "local_smoke")
    {
        _http = http ?? throw new ArgumentNullException(nameof(http));
        _userId = string.IsNullOrWhiteSpace(userId) ? "local_smoke" : userId;
    }

    public async Task<StateDiff> CreatePvEAsync(
        string stageId,
        IReadOnlyList<string> team,
        IReadOnlyList<string>? potions = null,
        CancellationToken ct = default)
    {
        var body = new
        {
            stageId,
            team,
            potions = potions ?? Array.Empty<string>(),
            seed = 0L,
            autoPlay = false,
        };
        using var resp = await _http.PostAsJsonAsync("v1/CreatePvE", body, JsonOptions, ct)
            .ConfigureAwait(false);
        await EnsureOk(resp, ct).ConfigureAwait(false);
        var diff = await resp.Content.ReadFromJsonAsync<StateDiff>(JsonOptions, ct).ConfigureAwait(false);
        return diff ?? throw new InvalidOperationException("CreatePvE empty body");
    }

    /// <summary>Dev helper: CreatePvE + server AutoPlay → finished stateDiff (tutorial smoke).</summary>
    public async Task<StateDiff> CreatePvEAutoPlayAsync(
        string stageId,
        IReadOnlyList<string> team,
        long seed = 20261104,
        CancellationToken ct = default)
    {
        var body = new
        {
            stageId,
            team,
            potions = Array.Empty<string>(),
            seed,
            autoPlay = true,
        };
        using var resp = await _http.PostAsJsonAsync("v1/CreatePvE", body, JsonOptions, ct)
            .ConfigureAwait(false);
        await EnsureOk(resp, ct).ConfigureAwait(false);
        var diff = await resp.Content.ReadFromJsonAsync<StateDiff>(JsonOptions, ct).ConfigureAwait(false);
        return diff ?? throw new InvalidOperationException("CreatePvE autoPlay empty body");
    }

    /// <summary>Dev helper: seed a finished PvP into replay store for §13.6 smoke.</summary>
    public async Task<StateDiff> CreatePvPAutoPlayAsync(
        IReadOnlyList<string> team1,
        IReadOnlyList<string> team2,
        string matchId = "smoke_match",
        long seed = 20261104,
        CancellationToken ct = default)
    {
        var body = new
        {
            matchId,
            team1,
            team2,
            seed,
            autoPlay = true,
        };
        using var resp = await _http.PostAsJsonAsync("v1/CreatePvP", body, JsonOptions, ct)
            .ConfigureAwait(false);
        await EnsureOk(resp, ct).ConfigureAwait(false);
        var diff = await resp.Content.ReadFromJsonAsync<StateDiff>(JsonOptions, ct).ConfigureAwait(false);
        return diff ?? throw new InvalidOperationException("CreatePvP autoPlay empty body");
    }

    public async Task<StateDiff> SubmitActionAsync(
        string battleId,
        BattleAction action,
        CancellationToken ct = default)
    {
        var body = new
        {
            battleId,
            action = new
            {
                kind = action.Kind,
                unitId = action.UnitId ?? "",
                handIndex = action.HandIndex ?? 0,
                targetId = action.TargetId ?? "",
                potionId = action.PotionId ?? "",
            },
        };
        using var resp = await _http.PostAsJsonAsync("v1/SubmitAction", body, JsonOptions, ct)
            .ConfigureAwait(false);
        if (!resp.IsSuccessStatusCode)
        {
            var err = await resp.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
            throw new InvalidOperationException($"SubmitAction rejected: {(int)resp.StatusCode} {err.Trim()}");
        }
        var diff = await resp.Content.ReadFromJsonAsync<StateDiff>(JsonOptions, ct).ConfigureAwait(false);
        return diff ?? throw new InvalidOperationException("SubmitAction empty body");
    }

    public async Task<IReadOnlyList<ReplayListItem>> ListReplaysAsync(CancellationToken ct = default)
    {
        using var resp = await _http.GetAsync($"v1/ListReplays?userId={Uri.EscapeDataString(_userId)}", ct)
            .ConfigureAwait(false);
        await EnsureOk(resp, ct).ConfigureAwait(false);
        var list = await resp.Content.ReadFromJsonAsync<List<ReplayListItem>>(JsonOptions, ct)
            .ConfigureAwait(false);
        return list ?? new List<ReplayListItem>();
    }

    public async Task<IReadOnlyList<ReplayFrame>> GetReplayAsync(string battleId, CancellationToken ct = default)
    {
        using var resp = await _http
            .GetAsync($"v1/GetReplay?battleId={Uri.EscapeDataString(battleId)}", ct)
            .ConfigureAwait(false);
        await EnsureOk(resp, ct).ConfigureAwait(false);
        var frames = await resp.Content.ReadFromJsonAsync<List<ReplayFrame>>(JsonOptions, ct)
            .ConfigureAwait(false);
        return frames ?? new List<ReplayFrame>();
    }

    private static async Task EnsureOk(HttpResponseMessage resp, CancellationToken ct)
    {
        if (resp.IsSuccessStatusCode) return;
        var err = await resp.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
        throw new InvalidOperationException($"HTTP {(int)resp.StatusCode}: {err.Trim()}");
    }
}
