using Mythfel.Client.Battle;
using Mythfel.Client.Data;
using Mythfel.Client.LiveOps;
using Mythfel.Client.Meta;
using Mythfel.Client.Net;
using Mythfel.Client.UI;

namespace Mythfel.LocalSmoke;

/// <summary>
/// Desktop stand-in for Unity Play / DEVICE_SMOKE rows that can run without Editor or store secrets.
/// Wires Hub + Shop + Tutorial + BattlePresenter + Replay against local CDN + battle/devapi.
/// </summary>
internal static class Program
{
    private static readonly string[] Starters =
    {
        "starter_tank_stone",
        "starter_fighter_fire",
        "starter_support_water",
    };

    private static readonly string[] DefaultGeo = { "RU", "BY", "KZ" };

    public static async Task<int> Main(string[] args)
    {
        var liveOpsUrl = EnvOrArg(args, "LIVEOPS_URL", "--liveops", "http://127.0.0.1:8090/v1/liveops.json");
        var battleUrl = EnvOrArg(args, "BATTLE_URL", "--battle", "http://127.0.0.1:8081/");
        var region = EnvOrArg(args, "CLIENT_REGION", "--region", "RU");
        var stubOnly = HasFlag(args, "--stub-only");

        Console.WriteLine("=== Mythfel LocalSmoke (presenter + hub + battle) ===");
        Console.WriteLine($"liveops: {liveOpsUrl}");
        Console.WriteLine($"battle:  {(stubOnly ? "(stub payloads, no HTTP)" : battleUrl)}");
        Console.WriteLine($"region:  {region}");
        Console.WriteLine();

        var analytics = new RecordingAnalytics();
        var tally = new Tally();

        // Geo / soft_launch_flag (§11 / §14)
        var allowed = SoftLaunchBootstrap.TryEnter(analytics, region, DefaultGeo);
        tally.Check("geo_allowlist_soft_launch_flag",
            allowed && analytics.Events.Any(e =>
                e.Name == SoftLaunchGeo.SoftLaunchFlagEvent &&
                e.Props.TryGetValue("allowed", out var a) && a == "1"));

        ILiveOpsSource liveOps;
        if (stubOnly)
        {
            liveOps = new StubLiveOpsSource();
            Console.WriteLine("LiveOps: StubLiveOpsSource (no CDN)");
        }
        else
        {
            using var httpLo = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
            try
            {
                liveOps = await HttpLiveOpsSource.FetchAsync(
                    httpLo, new Uri(liveOpsUrl), region).ConfigureAwait(false);
                var httpSrc = (HttpLiveOpsSource)liveOps;
                tally.Check("liveops_cdn_stub_fetch",
                    !string.IsNullOrEmpty(httpSrc.SignatureAlg) &&
                    string.Equals(httpSrc.SignatureAlg, HttpLiveOpsSource.StubSignatureAlg, StringComparison.Ordinal));
                Console.WriteLine($"LiveOps version={liveOps.Current.Version} sigAlg={httpSrc.SignatureAlg}");
            }
            catch (SoftLaunchGeoDeniedException)
            {
                analytics.Track(SoftLaunchGeo.SoftLaunchFlagEvent, new Dictionary<string, string>
                {
                    ["region"] = region,
                    ["allowed"] = "0",
                });
                Console.Error.WriteLine("FAIL liveops geo denied (expected for region outside allowlist)");
                tally.Fail();
                return tally.Exit();
            }
        }

        var loc = SmokeLoc();
        var hubView = new LogHubView();
        var hub = new HubPresenter(liveOps, loc, hubView);
        hub.Boot(HubTabId.Yard);
        hub.SelectTab(HubTabId.Clans);
        tally.Check("hub_soon_clans", hub.State.ActiveSoonSheet == SoonSheetId.ClanBoss);
        hub.OpenSoon(SoonSheetId.Farm);
        tally.Check("hub_soon_farm", hub.State.ActiveSoonSheet == SoonSheetId.Farm);
        hub.SetLocale("en");
        tally.Check("locale_en", loc.CurrentLocale == "en" && hub.State.Tabs[0].DisplayName == "Yard");
        hub.SetLocale("ru");
        tally.Check("locale_ru", loc.CurrentLocale == "ru" && hub.State.Tabs[0].DisplayName == "Двор");

        var shopView = new LogShopView();
        var shop = new ShopPresenter(liveOps, loc, shopView);
        shop.BindFromLiveOps();
        tally.Check("shop_no_invented_prices", shop.State.Offers.Count == liveOps.Current.Shop.Offers.Count);

        if (stubOnly)
        {
            await RunStubBattlePath(loc, tally).ConfigureAwait(false);
        }
        else
        {
            await RunHttpBattlePath(battleUrl, loc, tally).ConfigureAwait(false);
        }

        // Denied region smoke (analytics only; do not fail harness if allowlist works)
        var deniedAnalytics = new RecordingAnalytics();
        var denied = SoftLaunchBootstrap.TryEnter(deniedAnalytics, "US", DefaultGeo);
        tally.Check("geo_deny_us", !denied && deniedAnalytics.Events.Any(e =>
            e.Props.TryGetValue("allowed", out var a) && a == "0"));

        return tally.Exit();
    }

    private static async Task RunStubBattlePath(ILocCatalog loc, Tally tally)
    {
        var net = new StubBattleNetClient();
        net.Enqueue(WinDiff("stub_yard"));
        net.SetReplayList(new[]
        {
            new ReplayListItem
            {
                BattleId = "stub_pvp",
                MatchId = "m1",
                Seed = 1,
                Result = "p1_win",
                FrameCount = 2,
            },
        });
        net.SetReplay("stub_pvp", new[]
        {
            new ReplayFrame { Seq = 1, Note = "start" },
            new ReplayFrame { Seq = 2, Note = "end" },
        });

        var tutView = new LogTutorialView();
        var tut = new TutorialPresenter(net, loc, tutView);
        tut.Begin();
        await tut.StartYardBattleAsync().ConfigureAwait(false);
        tut.ApplyBattleResult("p1_win");
        tally.Check("tutorial_stub_victory", tut.State.IsComplete && tut.State.BattleResult == "p1_win");

        var hud = new LogHudView();
        var battle = new BattlePresenter(net, loc, hud);
        battle.ApplyStateDiff(WinDiff("stub_yard"));
        tally.Check("battle_presenter_binds_result", hud.Last?.Result == "p1_win");

        var replayView = new LogReplayView();
        var replays = new ReplayListPresenter(net, replayView);
        await replays.BootAsync().ConfigureAwait(false);
        await replays.OpenAsync("stub_pvp").ConfigureAwait(false);
        tally.Check("replay_open_stub", replays.State.IsOpen && replays.State.Frames.Count >= 1);
    }

    private static async Task RunHttpBattlePath(string battleBase, ILocCatalog loc, Tally tally)
    {
        using var http = new HttpClient
        {
            BaseAddress = new Uri(battleBase.EndsWith('/') ? battleBase : battleBase + "/"),
            Timeout = TimeSpan.FromSeconds(30),
        };

        // health
        using (var hz = await http.GetAsync("healthz").ConfigureAwait(false))
        {
            tally.Check("battle_devapi_healthz", hz.IsSuccessStatusCode);
            if (!hz.IsSuccessStatusCode)
            {
                Console.Error.WriteLine("battle devapi not up — start: cd battle && go run ./cmd/devapi");
                return;
            }
        }

        var net = new HttpBattleNetClient(http);

        // Illegal play reject (§13.5): create fresh battle, submit bad unit
        var open = await net.CreatePvEAsync(TutorialPresenter.SoftLaunchYardStageId, Starters)
            .ConfigureAwait(false);
        tally.Check("create_pve_open", !string.IsNullOrEmpty(open.BattleId) && open.Units.Count == 6);

        var hud = new LogHudView();
        var battle = new BattlePresenter(net, loc, hud);
        battle.ApplyStateDiff(open);
        tally.Check("battle_presenter_open_hud", hud.Last is { AllyBoard.Count: 3, EnemyBoard.Count: 3 });

        var rejected = false;
        try
        {
            await battle.SubmitAsync(BattleAction.PlayCard("no_such_unit", 0)).ConfigureAwait(false);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("rejected", StringComparison.OrdinalIgnoreCase)
                                                   || ex.Message.Contains("illegal", StringComparison.OrdinalIgnoreCase))
        {
            rejected = true;
            Console.WriteLine($"  illegal play rejected OK: {ex.Message}");
        }
        tally.Check("illegal_card_play_reject", rejected);

        // Tutorial path with autoPlay (server authoritative win)
        var autoNet = new HttpBattleNetClient(http);
        var winDiff = await autoNet.CreatePvEAutoPlayAsync(
            TutorialPresenter.SoftLaunchYardStageId, Starters).ConfigureAwait(false);
        tally.Check("yard_autoplay_p1_win", winDiff.Result == "p1_win");

        var tutView = new LogTutorialView();
        // TutorialPresenter CreatePvE uses non-auto API — seed stub wrapper for Create only
        var tutNet = new TutorialAutoPlayNet(autoNet, winDiff);
        var tut = new TutorialPresenter(tutNet, loc, tutView);
        tut.Begin();
        await tut.StartYardBattleAsync().ConfigureAwait(false);
        tut.ApplyStateDiff(winDiff);
        tally.Check("tutorial_http_victory_under_budget",
            tut.State.IsComplete && tut.State.Elapsed < TutorialPresenter.SoftLaunchBudget);

        // Replay seed + open (§13.6)
        var pvp = await autoNet.CreatePvPAutoPlayAsync(Starters, Starters).ConfigureAwait(false);
        tally.Check("pvp_autoplay_finished", !string.IsNullOrEmpty(pvp.Result));
        var replayView = new LogReplayView();
        var replays = new ReplayListPresenter(autoNet, replayView);
        await replays.BootAsync().ConfigureAwait(false);
        tally.Check("replay_list_nonempty", replays.State.Items.Count >= 1);
        if (replays.State.Items.Count >= 1)
        {
            await replays.OpenAsync(replays.State.Items[0].BattleId).ConfigureAwait(false);
            tally.Check("replay_open_frames", replays.State.IsOpen && replays.State.Frames.Count >= 1);
        }
    }

    private sealed class Tally
    {
        public int Fails { get; private set; }

        public void Fail() => Fails++;

        public void Check(string id, bool ok)
        {
            if (ok)
            {
                Console.WriteLine($"PASS {id}");
            }
            else
            {
                Console.WriteLine($"FAIL {id}");
                Fails++;
            }
        }

        public int Exit()
        {
            Console.WriteLine();
            if (Fails > 0)
            {
                Console.WriteLine($"LocalSmoke: NOT READY ({Fails} fail)");
                return 1;
            }
            Console.WriteLine("LocalSmoke: READY (presenter+hub+battle without store secrets)");
            Console.WriteLine("Next MANUAL: phone/emulator rows in qa/DEVICE_SMOKE.md (Unity mobile build still out of repo).");
            return 0;
        }
    }

    private static StateDiff WinDiff(string battleId) => new()
    {
        BattleId = battleId,
        Seq = 9,
        Turn = 5,
        Active = 0,
        Result = "p1_win",
        P1 = new PlayerDiff { Energy = 0, MilkDrops = 1, MilkBursts = 0, KeepCost = 1 },
        P2 = new PlayerDiff { Energy = 0, MilkDrops = 0, MilkBursts = 0, KeepCost = 1 },
        Units = new[]
        {
            new UnitDiff { Id = "p1_0", Side = 0, Lane = 0, Hp = 20, MaxHp = 40, Alive = true, Role = "tank", Element = "stone" },
            new UnitDiff { Id = "p1_1", Side = 0, Lane = 1, Hp = 15, MaxHp = 35, Alive = true, Role = "fighter", Element = "fire" },
            new UnitDiff { Id = "p1_2", Side = 0, Lane = 2, Hp = 10, MaxHp = 30, Alive = true, Role = "support", Element = "water" },
            new UnitDiff { Id = "p2_0", Side = 1, Lane = 0, Hp = 0, MaxHp = 25, Alive = false, Role = "tank", Element = "stone" },
            new UnitDiff { Id = "p2_1", Side = 1, Lane = 1, Hp = 0, MaxHp = 25, Alive = false, Role = "fighter", Element = "fire" },
            new UnitDiff { Id = "p2_2", Side = 1, Lane = 2, Hp = 0, MaxHp = 25, Alive = false, Role = "support", Element = "water" },
        },
        Hand = Array.Empty<HandCardDiff>(),
        PotionTray = Array.Empty<PotionSlotDiff>(),
        CanKeep = false,
        CanEndTurn = false,
    };

    private static DictionaryLocCatalog SmokeLoc() => new(new Dictionary<string, IReadOnlyDictionary<string, string>>
    {
        ["hub.tab.yard"] = D("Двор", "Yard"),
        ["hub.tab.pvp"] = D("PvP", "PvP"),
        ["hub.tab.collection"] = D("Коллекция", "Collection"),
        ["hub.tab.shop"] = D("Магазин", "Shop"),
        ["hub.tab.clans"] = D("Кланы", "Clans"),
        ["hub.tab.more"] = D("Ещё", "More"),
        ["hub.soon.clan_boss.title"] = D("Клан-босс", "Clan Boss"),
        ["hub.soon.farm.title"] = D("Ферма", "Farm"),
        ["hub.soon.nursery.title"] = D("Питомник", "Nursery"),
        ["hub.soon.body"] = D("Скоро", "Coming soon"),
        ["tutorial.step.starters"] = D("Стартеры", "Starters"),
        ["tutorial.step.yard_battle"] = D("Бой во Дворе", "Yard battle"),
        ["tutorial.step.victory"] = D("Победа во Дворе", "Yard victory"),
        ["tutorial.step.overtime"] = D("Слишком долго", "Overtime"),
        ["locale.name.ru"] = D("Русский", "Russian"),
        ["locale.name.en"] = D("English", "English"),
    });

    private static IReadOnlyDictionary<string, string> D(string ru, string en) =>
        new Dictionary<string, string> { ["ru"] = ru, ["en"] = en };

    private static string EnvOrArg(string[] args, string env, string flag, string fallback)
    {
        var fromEnv = Environment.GetEnvironmentVariable(env);
        if (!string.IsNullOrWhiteSpace(fromEnv)) return fromEnv.Trim();
        for (var i = 0; i < args.Length - 1; i++)
        {
            if (args[i] == flag) return args[i + 1];
        }
        return fallback;
    }

    private static bool HasFlag(string[] args, string flag) =>
        args.Any(a => string.Equals(a, flag, StringComparison.Ordinal));

    /// <summary>Wraps Http client so Tutorial CreatePvE returns a finished autoPlay diff once.</summary>
    private sealed class TutorialAutoPlayNet : IBattleNetClient
    {
        private readonly HttpBattleNetClient _inner;
        private readonly StateDiff _win;
        private bool _used;

        public TutorialAutoPlayNet(HttpBattleNetClient inner, StateDiff win)
        {
            _inner = inner;
            _win = win;
        }

        public Task<StateDiff> CreatePvEAsync(
            string stageId,
            IReadOnlyList<string> team,
            IReadOnlyList<string>? potions = null,
            CancellationToken ct = default)
        {
            if (_used) return _inner.CreatePvEAsync(stageId, team, potions, ct);
            _used = true;
            return Task.FromResult(_win);
        }

        public Task<StateDiff> SubmitActionAsync(string battleId, BattleAction action, CancellationToken ct = default) =>
            _inner.SubmitActionAsync(battleId, action, ct);

        public Task<IReadOnlyList<ReplayListItem>> ListReplaysAsync(CancellationToken ct = default) =>
            _inner.ListReplaysAsync(ct);

        public Task<IReadOnlyList<ReplayFrame>> GetReplayAsync(string battleId, CancellationToken ct = default) =>
            _inner.GetReplayAsync(battleId, ct);
    }

    private sealed class LogHubView : IHubView
    {
        public void Render(HubViewState state) =>
            Console.WriteLine($"  [hub] tab={state.ActiveTab} soon={state.ActiveSoonSheet} locale tabs={state.Tabs[0].DisplayName}");
    }

    private sealed class LogShopView : IShopView
    {
        public void Render(ShopViewState state) =>
            Console.WriteLine($"  [shop] offers={state.Offers.Count}");
    }

    private sealed class LogTutorialView : ITutorialView
    {
        public void Render(TutorialViewState state) =>
            Console.WriteLine($"  [tutorial] step={state.Step} result={state.BattleResult} done={state.IsComplete}");
    }

    private sealed class LogHudView : IBattleHudView
    {
        public BattleViewState? Last { get; private set; }
        public void Render(BattleViewState state)
        {
            Last = state;
            Console.WriteLine($"  [hud] battle={state.BattleId} seq={state.Seq} result={state.Result} allies={state.AllyBoard.Count}");
        }
    }

    private sealed class LogReplayView : IReplayListView
    {
        public void Render(ReplayListViewState state) =>
            Console.WriteLine($"  [replay] items={state.Items.Count} open={state.IsOpen} frames={state.Frames.Count}");
    }
}
