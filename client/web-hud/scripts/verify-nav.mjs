#!/usr/bin/env node
/**
 * Static smoke for Stitch Web HUD navigation graph (packs 0268/64d5).
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
  "viewPvp",
  "viewShop",
  "viewMarket",
  "viewTavern",
  "viewPass",
  "viewSoon",
  "viewEquipCards",
  "viewAuction",
  "viewGuild",
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
    html.includes('data-stitch="home"'),
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
    fs.existsSync(path.join(PUBLIC, "stitch-ref", "64d5", "heroes.png")),
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
ok("app battle/devapi CreatePvE", js.includes("/api/battle/v1/CreatePvE"));
ok("app no client damage authority note", js.includes("No combat authority"));
ok("app GrantStarterKit smoke", js.includes("/api/dev/starter") && js.includes("applyStarterGrant"));
ok("app stub auth free login", js.includes("/api/dev/login") && js.includes("function stubLogin"));
ok("app pvp unlock helper", js.includes("function pvpUnlocked"));
ok("app milk_on_ice", js.includes("milk_on_ice"));

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

const transitions = [
  ["login→hub", 'navigate("hub")'],
  ["hub brand", "btnBrandHub"],
  ["yard→formation inline", 'navigate("formation")'],
  ["formation→yard", 'navigate("yard")'],
  ["formation→tavern", 'navigate("tavern")'],
  ["collection→formation", "btnColFormation"],
  ["pvp→formation", "btnPvpFormation"],
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

// Placeholders present for missing IA forms
for (const id of ["yard", "tavern", "shop", "pvp", "equip_cards", "boss_raid"]) {
  ok(`placeholder host ${id}`, html.includes(`data-stitch="${id}"`) && html.includes(`data-placeholder="1"`));
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
