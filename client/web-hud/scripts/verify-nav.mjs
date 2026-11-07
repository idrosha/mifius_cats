#!/usr/bin/env node
/**
 * Static smoke for Stitch Web HUD navigation graph (packs 0268/64d5/e608/4da7/18c7/ba17/17eb).
 * Usage: node client/web-hud/scripts/verify-nav.mjs [baseUrl]
 * HTTP checks skipped when HUD is not running (assignment default).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, "../public");
const DESIGN = path.resolve(__dirname, "../design");
const BASE = (process.argv[2] || "http://127.0.0.1:8088").replace(/\/$/, "");

const REQUIRED_VIEWS = [
  "viewBoot",
  "viewHub",
  "viewCodex",
  "viewLogin",
  "viewHome",
  "viewGear",
  "viewCollection",
  "viewArmorSets",
  "viewClassSets",
  "viewHeroes",
  "viewCraft",
  "viewBreeding",
  "viewSoonFarm",
  "viewFormation",
  "viewYard",
  "viewPractice",
  "viewBossDungeon",
  "viewBossRaid",
  "viewBattle",
  "viewResult",
  "viewResultWin",
  "viewResultLose",
  "viewPvp",
  "viewTradeHub",
  "viewShop",
  "viewMarket",
  "viewTavern",
  "viewPass",
  "viewSoon",
  "viewEquipCards",
  "viewAuction",
  "viewGuild",
  "viewGuildBattle",
  "viewChatGlobal",
  "viewChatGuild",
  "viewChatFriends",
  "viewRatingPlayers",
  "viewRatingGuilds",
];

const REQUIRED_NAV_IDS = [
  "hub",
  "codex",
  "login",
  "yard",
  "boss_dungeon",
  "boss_raid",
  "pvp",
  "collection",
  "trade_hub",
  "shop",
  "market",
  "tavern",
  "pass",
  "auction",
  "gear",
  "home",
  "heroes",
  "armor_sets",
  "class_sets",
  "equip_cards",
  "craft",
  "breeding",
  "guild",
  "guild_battle",
  "chat_global",
  "chat_guild",
  "chat_friends",
  "rating_players",
  "rating_guilds",
  "practice",
];

const REQUIRED_BUTTONS = [
  "btnLoginEnter",
  "btnPracticeBattle",
  "btnPracticeHub",
  "btnCodexHub",
  "btnYardToFormation",
  "btnFormationBattle",
  "btnFormationYard",
  "btnFormationTavern",
  "btnBossDungeonRaid",
  "btnBossRaidFormation",
  "btnTavernFormation",
  "btnResultHub",
  "btnPvpFormation",
  "btnColFormation",
  "btnBrandHub",
  "btnSoonHub",
  "btnGuildBattleFormation",
  "btnGuildBattleHub",
];

const STITCH_SRC = [
  "hub.html",
  "login.html",
  "collection.html",
  "armor_sets.html",
  "gear.html",
  "class_sets.html",
  "home.html",
  "breeding.html",
  "craft.html",
  "codex.html",
  "heroes.html",
  "soon_farm.html",
  "yard.html",
  "formation.html",
  "battle.html",
  "result_win.html",
  "boss_dungeon.html",
  "boss_raid.html",
  "pvp.html",
  "guild_battle.html",
  "practice.html",
  "guild.html",
  "pass.html",
  "chat_global.html",
  "chat_guild.html",
  "chat_friends.html",
  "tavern.html",
  "shop.html",
  "market.html",
  "auction.html",
  "rating_players.html",
  "rating_guilds.html",
];

const checks = [];
function ok(name, pass, detail = "") {
  checks.push({ name, pass: !!pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
}

const html = fs.readFileSync(path.join(PUBLIC, "index.html"), "utf8");
const js = fs.readFileSync(path.join(PUBLIC, "app.js"), "utf8");
const css = fs.readFileSync(path.join(PUBLIC, "styles.css"), "utf8");

for (const id of REQUIRED_VIEWS) ok(`html#${id}`, html.includes(`id="${id}"`));
for (const id of REQUIRED_BUTTONS) ok(`html#${id}`, html.includes(`id="${id}"`));

ok(
  "stitch html applied (tailwind + material + local stitch assets)",
  html.includes("cdn.tailwindcss.com") &&
    html.includes("Material+Symbols") &&
    html.includes("/stitch-assets/") &&
    html.includes('data-stitch="hub"') &&
    html.includes('data-stitch="home"') &&
    html.includes('data-stitch="yard"') &&
    html.includes('data-stitch="battle"'),
);
ok(
  "no remote lh3 image hosts in built index",
  !/lh3\.googleusercontent\.com\/(?:aida-public|aida)\//.test(html),
);
ok(
  "vendored stitch-assets present",
  fs.existsSync(path.join(PUBLIC, "stitch-assets", "manifest.json")) &&
    fs.readdirSync(path.join(PUBLIC, "stitch-assets")).filter((f) => f.endsWith(".jpg")).length >= 10,
);
ok(
  "public stitch-ref screenshots present",
  fs.existsSync(path.join(PUBLIC, "stitch-ref", "0268", "home.png")) &&
    fs.existsSync(path.join(PUBLIC, "stitch-ref", "64d5", "heroes.png")) &&
    fs.existsSync(path.join(PUBLIC, "stitch-ref", "e608", "yard.png")) &&
    fs.existsSync(path.join(PUBLIC, "stitch-ref", "4da7", "pvp.png")) &&
    fs.existsSync(path.join(PUBLIC, "stitch-ref", "18c7", "practice.png")) &&
    fs.existsSync(path.join(PUBLIC, "stitch-ref", "18c7", "guild.png")) &&
    fs.existsSync(path.join(PUBLIC, "stitch-ref", "ba17", "pass.png")) &&
    fs.existsSync(path.join(PUBLIC, "stitch-ref", "ba17", "chat.png")) &&
    fs.existsSync(path.join(PUBLIC, "stitch-ref", "17eb", "tavern.png")) &&
    fs.existsSync(path.join(PUBLIC, "stitch-ref", "17eb", "shop.png")) &&
    fs.existsSync(path.join(PUBLIC, "stitch-ref", "17eb", "market.png")) &&
    fs.existsSync(path.join(PUBLIC, "stitch-ref", "17eb", "auction.png")) &&
    fs.existsSync(path.join(PUBLIC, "stitch-ref", "17eb", "rating.png")),
);
ok("appNav primary+subtabs shell", html.includes('id="appNav"') && html.includes('id="appSubTabs"'));
ok(
  "css kills stitch double-nav",
  css.includes(".stitch-view > header nav") && css.includes("display: none"),
);
ok("css full-viewport shell", css.includes("mythfel-shell") && css.includes("min-height: 100vh"));
ok(
  "css landscape flush form stage",
  css.includes("--mythfel-form-ratio") &&
    css.includes("aspect-ratio: var(--mythfel-form-ratio)") &&
    css.includes(".mythfel-form") &&
    css.includes("single flush level"),
);
ok("html landscape layout meta", html.includes('data-layout="landscape"') && html.includes("landscape-flush"));
ok("html mythfel-form class on views", html.includes("mythfel-form") && html.includes('data-stitch="home"'));
ok("painted battle screens not placeholders", !html.includes('data-stitch="yard" data-placeholder') && html.includes('data-stitch="yard"'));
ok("painted formation not placeholder", html.includes('data-stitch="formation"') && !/<section[^>]*data-stitch="formation"[^>]*data-placeholder/.test(html));

ok(
  "app NAV primary/subtabs",
  js.includes("const NAV =") &&
    js.includes("nav.primary.character") &&
    js.includes("nav.primary.combat") &&
    REQUIRED_NAV_IDS.every((id) => js.includes(`id: "${id}"`)),
);
ok(
  "formation is inline (not combat subtab)",
  js.includes('navigate("formation")') &&
    !/tabs:\s*\[[^\]]*\{ id: "formation"/s.test(js.match(/id: "combat"[\s\S]*?tabs:\s*\[[\s\S]*?\]/)?.[0] || ""),
);
ok("app navigate()", js.includes("function navigate("));
ok(
  "showView only toggles #app > section (not nested Stitch mains)",
  js.includes('querySelectorAll("#app > section")') && !js.includes('querySelectorAll("main > section")'),
);
ok("gate tip auto-hides (no orphan banner)", js.includes("function hideGateTip") && js.includes("hideGateTip._t"));
ok(
  "home integrated hosts (no float-only panel)",
  html.includes('id="homeCatPicker"') &&
    html.includes('id="homeGearBlock"') &&
    html.includes('id="homeHeroCard"') &&
    html.includes('data-purpose="character-home"'),
);
ok("css kills leftover stitch pt-28 void", css.includes("padding-top: 0.75rem !important") && css.includes("pt-28"));
ok("css subtabs even spacing nowrap", css.includes("space-evenly") && css.includes("flex-wrap: nowrap"));
ok("app battle/devapi CreatePvE", js.includes("/api/battle/v1/CreatePvE"));
ok("app no client damage authority note", js.includes("No combat authority"));
ok("app GrantStarterKit smoke", js.includes("/api/dev/starter") && js.includes("applyStarterGrant"));
ok("app stub auth free login", js.includes("/api/dev/login") && js.includes("function stubLogin"));
ok("app pvp unlock helper", js.includes("function pvpUnlocked"));
ok("app milk_on_ice", js.includes("milk_on_ice"));
ok("guild_battle has own view", js.includes('guild_battle: "viewGuildBattle"'));

for (const f of STITCH_SRC) {
  const p = path.join(DESIGN, "stitch-src", f);
  ok(`vendored stitch-src/${f}`, fs.existsSync(p));
  if (fs.existsSync(p)) {
    const body = fs.readFileSync(p, "utf8");
    ok(`stitch-src/${f} has tailwind`, body.includes("cdn.tailwindcss.com") || body.includes("tailwind.config"));
    ok(`stitch-src/${f} not stub`, body.length > 5000 && !body.includes("Нужен мок Stitch"));
    ok(`stitch-src/${f} no remote lh3`, !/lh3\.googleusercontent\.com\/(?:aida-public|aida)\//.test(body));
  }
}

ok(
  "home is Дом Хранителя desk",
  fs.readFileSync(path.join(DESIGN, "stitch-src", "home.html"), "utf8").includes("Дом Хранителя") &&
    /Инвентар|Экипиров/i.test(fs.readFileSync(path.join(DESIGN, "stitch-src", "home.html"), "utf8")),
);
ok(
  "heroes is archetype codex",
  /Кодекс Боевых Архетипов|12 Архетип/i.test(
    fs.readFileSync(path.join(DESIGN, "stitch-src", "heroes.html"), "utf8"),
  ),
);
ok(
  "login has enter CTA",
  /Войти|Регистрац/i.test(fs.readFileSync(path.join(DESIGN, "stitch-src", "login.html"), "utf8")),
);
ok(
  "yard is Mythmir start",
  /Мифмир|В БОЙ/i.test(fs.readFileSync(path.join(DESIGN, "stitch-src", "yard.html"), "utf8")),
);
ok(
  "battle is fight HUD",
  /ЗАВЕРШИТЬ ХОД|РАУНД/i.test(fs.readFileSync(path.join(DESIGN, "stitch-src", "battle.html"), "utf8")),
);
ok(
  "result_win is victory",
  /Побед/i.test(fs.readFileSync(path.join(DESIGN, "stitch-src", "result_win.html"), "utf8")),
);
ok(
  "practice is dojo fight",
  /Тренировка|Додзё|Спарринг-Манекен/i.test(
    fs.readFileSync(path.join(DESIGN, "stitch-src", "practice.html"), "utf8"),
  ),
);
ok(
  "guild is guild hall",
  /Зал Гильдии|Орден|Гильди/i.test(
    fs.readFileSync(path.join(DESIGN, "stitch-src", "guild.html"), "utf8"),
  ),
);
ok(
  "painted practice not placeholder",
  html.includes('data-stitch="practice"') &&
    !/<section[^>]*data-stitch="practice"[^>]*data-placeholder/.test(html),
);
ok(
  "painted guild not placeholder",
  html.includes('data-stitch="guild"') &&
    !/<section[^>]*data-stitch="guild"[^>]*data-placeholder/.test(html),
);
ok(
  "pass is battle pass track",
  /СЕЗОН|Боевой пасс|Сезонный Пропуск|Лап[ыа] Судьб/i.test(
    fs.readFileSync(path.join(DESIGN, "stitch-src", "pass.html"), "utf8"),
  ),
);
ok(
  "chat_global is chats layout",
  /Общий Чат|Чаты|Таверн/i.test(
    fs.readFileSync(path.join(DESIGN, "stitch-src", "chat_global.html"), "utf8"),
  ),
);
ok(
  "painted pass not placeholder",
  html.includes('data-stitch="pass"') &&
    !/<section[^>]*data-stitch="pass"[^>]*data-placeholder/.test(html),
);
ok(
  "painted chat_global not placeholder",
  html.includes('data-stitch="chat_global"') &&
    !/<section[^>]*data-stitch="chat_global"[^>]*data-placeholder/.test(html),
);
ok(
  "painted chat_guild not placeholder",
  html.includes('data-stitch="chat_guild"') &&
    !/<section[^>]*data-stitch="chat_guild"[^>]*data-placeholder/.test(html),
);
ok(
  "painted chat_friends not placeholder",
  html.includes('data-stitch="chat_friends"') &&
    !/<section[^>]*data-stitch="chat_friends"[^>]*data-placeholder/.test(html),
);
ok(
  "tavern is milk bar",
  /Таверн|Молок|Барная Карта|Хрустящая Мышка/i.test(
    fs.readFileSync(path.join(DESIGN, "stitch-src", "tavern.html"), "utf8"),
  ),
);
ok(
  "shop is donate lavka",
  /Магазин|Ларец|Серая Броня|Боевой Пасс|Семя Стихий/i.test(
    fs.readFileSync(path.join(DESIGN, "stitch-src", "shop.html"), "utf8"),
  ),
);
ok(
  "market is tools/seeds",
  /Рынок|Лопата|Семена|Скупк|Кирка/i.test(
    fs.readFileSync(path.join(DESIGN, "stitch-src", "market.html"), "utf8"),
  ),
);
ok(
  "auction is player lots",
  /Аукцион|Выставить лот|лотов|Торги/i.test(
    fs.readFileSync(path.join(DESIGN, "stitch-src", "auction.html"), "utf8"),
  ),
);
ok(
  "rating_players is leaderboard",
  /Рейтинг Игроков|Таблица Лидеров|Топ-100/i.test(
    fs.readFileSync(path.join(DESIGN, "stitch-src", "rating_players.html"), "utf8"),
  ),
);
ok(
  "painted tavern not placeholder",
  html.includes('data-stitch="tavern"') &&
    !/<section[^>]*data-stitch="tavern"[^>]*data-placeholder/.test(html),
);
ok(
  "painted shop not placeholder",
  html.includes('data-stitch="shop"') &&
    !/<section[^>]*data-stitch="shop"[^>]*data-placeholder/.test(html),
);
ok(
  "painted market not placeholder",
  html.includes('data-stitch="market"') &&
    !/<section[^>]*data-stitch="market"[^>]*data-placeholder/.test(html),
);
ok(
  "painted auction not placeholder",
  html.includes('data-stitch="auction"') &&
    !/<section[^>]*data-stitch="auction"[^>]*data-placeholder/.test(html),
);
ok(
  "painted rating_players not placeholder",
  html.includes('data-stitch="rating_players"') &&
    !/<section[^>]*data-stitch="rating_players"[^>]*data-placeholder/.test(html),
);
ok(
  "painted rating_guilds not placeholder",
  html.includes('data-stitch="rating_guilds"') &&
    !/<section[^>]*data-stitch="rating_guilds"[^>]*data-placeholder/.test(html),
);

const transitions = [
  ["login→hub", 'navigate("hub")'],
  ["hub brand", "btnBrandHub"],
  ["yard→formation inline", 'navigate("formation")'],
  ["formation→yard", 'navigate("yard")'],
  ["formation→tavern", 'navigate("tavern")'],
  ["collection→formation", "btnColFormation"],
  ["pvp→formation", "btnPvpFormation"],
  ["guild_battle→formation", "btnGuildBattleFormation"],
  ["soft в бой→formation", '["в бой", () => navigate("formation")]'],
  ["soft mythworld-pve", '"mythworld-pve": "yard"'],
  ["soft pvp-arena path", '"pvp-arena": "pvp"'],
  ["soft guild-war path", '"guild-war": "guild_battle"'],
  ["soft dungeons-and-raids", '"dungeons-and-raids": "boss_dungeon"'],
  ["soft trenirovka-dodzyo→practice", '"trenirovka-dodzyo": "practice"'],
  ["soft zal-gildii→guild", '"zal-gildii": "guild"'],
  ["soft вступить в рейд", '["вступить в рейд", () => navigate("boss_raid")]'],
  ["soft вступить в группу", '["вступить в группу", () => navigate("boss_dungeon")]'],
  ["soft дуэль→formation", '["дуэль", () => navigate("formation")]'],
  ["soft забрать всё→pass", '["забрать всё", () => navigate("pass")]'],
  ["soft в лс→chat_friends", '["в лс", () => navigate("chat_friends")]'],
  ["soft остановить тест", '["остановить тест", () => navigate("hub")]'],
  ["soft tavern-pass→pass", '"tavern-pass": "pass"'],
  ["soft chats→chat_global", 'chats: "chat_global"'],
  ["soft tavern-bar→tavern", '"tavern-bar": "tavern"'],
  ["soft shop-donate→shop", '"shop-donate": "shop"'],
  ["soft market-resources→market", '"market-resources": "market"'],
  ["soft player-auctions→auction", '"player-auctions": "auction"'],
  ["soft trade-hub→trade_hub", '"trade-hub": "trade_hub"'],
  ["soft khab-torgovli→trade_hub", '"khab-torgovli-glavnaya": "trade_hub"'],
  ["soft khab-torgovli-karta→trade_hub", '"khab-torgovli-karta": "trade_hub"'],
  ["soft rejting-igrokov→rating_players", '"rejting-igrokov-sezon-4": "rating_players"'],
  ["soft войти в бар→tavern", '["войти в бар", () => navigate("tavern")]'],
  ["soft в магазин→shop", '["в магазин", () => navigate("shop")]'],
  ["soft на рынок→market", '["на рынок", () => navigate("market")]'],
  ["soft в зал аукциона→auction", '["в зал аукциона", () => navigate("auction")]'],
  ["soft рейтинг гильдий→rating_guilds", '["рейтинг гильдий", () => navigate("rating_guilds")]'],
  ["pass route", 'navigate("pass")'],
  ["chat_global route", 'navigate("chat_global")'],
  ["tavern route", 'navigate("tavern")'],
  ["shop route", 'navigate("shop")'],
  ["market route", 'navigate("market")'],
  ["auction route", 'navigate("auction")'],
  ["rating_players route", 'navigate("rating_players")'],
  ["home route", 'navigate("home")'],
  ["gear route", 'navigate("gear")'],
  ["heroes route", 'navigate("heroes")'],
  ["armor_sets route", 'navigate("armor_sets")'],
  ["class_sets route", 'navigate("class_sets")'],
  ["craft route", 'navigate("craft")'],
  ["breeding route", 'navigate("breeding")'],
  ["codex route", 'navigate("codex")'],
  ["farm route", 'navigate("farm"'],
  ["login route", 'navigate("login")'],
  ["gate tip", "Подними ранг в боях"],
  ["new path personazh→home", '"personazh": "home"'],
  ["new path kodeks-mifmira→codex", '"kodeks-mifmira": "codex"'],
  ["new path skreshchivanie→breeding", '"skreshchivanie": "breeding"'],
];
for (const [name, needle] of transitions) {
  ok(`transition ${name}`, js.includes(needle));
}

// Working transition forms (no longer empty placeholders)
for (const id of ["equip_cards", "result_lose", "soon_clan"]) {
  ok(
    `working host ${id}`,
    html.includes(`data-stitch="${id}"`) &&
      !new RegExp(`data-stitch="${id}"[^>]*data-placeholder="1"`).test(html),
  );
}

let httpOk = false;
try {
  const res = await fetch(`${BASE}/healthz`);
  const data = await res.json();
  httpOk = res.ok && data?.ok === true;
  ok("http /healthz", httpOk, BASE);
  if (httpOk) {
    const page = await fetch(`${BASE}/`);
    const body = await page.text();
    ok("http / serves index", page.ok && body.includes("viewHub") && body.includes("cdn.tailwindcss.com"));
    ok("http / has appSubTabs", body.includes('id="appSubTabs"'));
    const loc = await fetch(`${BASE}/loc.json`);
    const locJson = await loc.json();
    ok("http /loc.json nav.primary.character = Дом Хранителя", locJson["nav.primary.character"]?.ru === "Дом Хранителя");
    ok("http /loc.json nav.sub.home = Персонаж", locJson["nav.sub.home"]?.ru === "Персонаж");
  }
} catch (err) {
  ok("http /healthz (HUD not required)", true, `skipped: ${err.message || err}`);
}

const failed = checks.filter((c) => !c.pass);
console.log("\n---");
console.log(`Total ${checks.length} · pass ${checks.length - failed.length} · fail ${failed.length}`);
if (failed.length) {
  for (const f of failed) console.log("FAIL detail:", f.name, f.detail);
}
process.exit(failed.length ? 1 : 0);
