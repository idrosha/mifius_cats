#!/usr/bin/env node
/**
 * Static + HTTP smoke for Stitch Web HUD navigation graph.
 * Usage: node client/web-hud/scripts/verify-nav.mjs [baseUrl]
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
  "viewYard",
  "viewFormation",
  "viewBossDungeon",
  "viewBossRaid",
  "viewBattle",
  "viewResult",
  "viewPvp",
  "viewCollection",
  "viewShop",
  "viewMarket",
  "viewTavern",
  "viewPass",
  "viewSoon",
  "viewGear",
  "viewHome",
  "viewCraft",
  "viewBreeding",
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
  "yard",
  "formation",
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
  "craft",
  "breeding",
  "guild",
  "chat_global",
  "chat_guild",
  "chat_friends",
  "rating_players",
  "rating_guilds",
];

const REQUIRED_BUTTONS = [
  "btnYardToFormation",
  "btnFormationBattle",
  "btnFormationYard",
  "btnFormationTavern",
  "btnBossDungeonRaid",
  "btnBossDungeonHub",
  "btnBossRaidHub",
  "btnBossRaidFormation",
  "btnBossRaidDungeon",
  "btnTavernFormation",
  "btnTavernHub",
  "btnResultHub",
  "btnResultYard",
  "btnResultRetry",
  "btnResultFormation",
  "btnPvpFormation",
  "btnColFormation",
  "btnShopToTavern",
  "btnMarketToShop",
  "btnPassShop",
  "btnPassHub",
  "btnSoonHub",
  "btnSellStarter",
  "btnEndTurn",
  "btnBackHub",
  "btnBrandHub",
];

const STITCH_SRC = [
  "hub.html",
  "yard.html",
  "formation.html",
  "boss_dungeon.html",
  "boss_raid.html",
  "battle.html",
  "tavern.html",
  "collection.html",
  "shop.html",
  "market.html",
  "pvp.html",
  "pass.html",
  "gear.html",
  "craft.html",
  "breeding.html",
  "auction.html",
  "guild.html",
  "chat_global.html",
  "rating_players.html",
];

const checks = [];
function ok(name, pass, detail = "") {
  checks.push({ name, pass: !!pass, detail });
  const mark = pass ? "PASS" : "FAIL";
  console.log(`${mark}  ${name}${detail ? " — " + detail : ""}`);
}

const html = fs.readFileSync(path.join(PUBLIC, "index.html"), "utf8");
const js = fs.readFileSync(path.join(PUBLIC, "app.js"), "utf8");
const css = fs.readFileSync(path.join(PUBLIC, "styles.css"), "utf8");

for (const id of REQUIRED_VIEWS) {
  ok(`html#${id}`, html.includes(`id="${id}"`));
}
for (const id of REQUIRED_BUTTONS) {
  ok(`html#${id}`, html.includes(`id="${id}"`));
}

ok(
  "stitch html applied (tailwind + material + aida)",
  html.includes("cdn.tailwindcss.com") &&
    html.includes("Material+Symbols") &&
    html.includes("lh3.googleusercontent.com") &&
    html.includes('data-stitch="hub"'),
);
ok("appNav primary+subtabs shell", html.includes('id="appNav"') && html.includes('id="appSubTabs"'));
ok(
  "css kills stitch double-nav",
  css.includes(".stitch-view > header nav") && css.includes("display: none"),
);
ok(
  "css full-viewport shell",
  css.includes("mythfel-shell") && css.includes("min-height: 100vh"),
);
ok(
  "css stitch tokens",
  css.includes("--primary-container") && css.includes("Rubik"),
);
ok(
  "app NAV primary/subtabs",
  js.includes("const NAV =") &&
    js.includes("nav.primary.character") &&
    js.includes("nav.primary.combat") &&
    REQUIRED_NAV_IDS.every((id) => js.includes(`id: "${id}"`)),
);
ok("app navigate()", js.includes("function navigate("));
ok("app battle/devapi CreatePvE", js.includes("/api/battle/v1/CreatePvE"));
ok("app no client damage authority note", js.includes("No combat authority"));
ok("app GrantStarterKit smoke", js.includes("/api/dev/starter") && js.includes("applyStarterGrant"));
ok("boss_raid remap from pve_12", js.includes('boss_raid') && html.includes('data-stitch="boss_raid"'));
ok(
  "boss_dungeon wired",
  js.includes('id: "boss_dungeon"') && html.includes('data-stitch="boss_dungeon"'),
);
ok(
  "рейд-на-дога → boss_raid (not soon)",
  js.includes('"рейд-на-дога": "boss_raid"') || js.includes('"рейд-на-дога":"boss_raid"'),
);
ok(
  "бой-3v3 → formation",
  js.includes('"бой-3v3": "formation"') || js.includes('"бой-3v3":"formation"'),
);

const bossSrc = path.join(DESIGN, "stitch-src", "boss_raid.html");
if (fs.existsSync(bossSrc)) {
  const body = fs.readFileSync(bossSrc, "utf8");
  ok(
    "boss_raid not mislabeled Бой PvE",
    !body.includes("Бой PvE (12") && body.includes("Рейд"),
  );
  ok("boss_raid has legion/12 content", /12/.test(body) && /Дог|босс|Босс/i.test(body));
}

for (const f of STITCH_SRC) {
  const p = path.join(DESIGN, "stitch-src", f);
  ok(`vendored stitch-src/${f}`, fs.existsSync(p));
  if (fs.existsSync(p)) {
    const body = fs.readFileSync(p, "utf8");
    ok(
      `stitch-src/${f} has tailwind`,
      body.includes("cdn.tailwindcss.com") || body.includes("tailwind.config"),
    );
  }
}

ok("Мифмир rename in yard source", fs.readFileSync(path.join(DESIGN, "stitch-src", "yard.html"), "utf8").includes("Мифмир"));

const transitions = [
  ["hub→yard", 'navigate("yard")'],
  ["yard→formation", 'navigate("formation")'],
  ["formation→tavern", 'navigate("tavern")'],
  ["tavern→formation", "btnTavernFormation"],
  ["shop→tavern", 'navigate("tavern")'],
  ["market sell", "btnSellStarter"],
  ["result→hub", 'navigate("hub")'],
  ["boss_raid route", 'navigate("boss_raid")'],
  ["boss_dungeon route", 'navigate("boss_dungeon")'],
  ["auction route", 'navigate("auction")'],
  ["breeding route", 'navigate("breeding")'],
  ["craft route", 'navigate("craft")'],
  ["chat_global route", 'navigate("chat_global")'],
  ["rating_players route", 'navigate("rating_players")'],
];
for (const [name, needle] of transitions) {
  ok(`transition ${name}`, js.includes(needle));
}

// Newly vendored screens must be real Stitch (not stub placeholders)
for (const f of [
  "boss_dungeon.html",
  "market.html",
  "guild.html",
  "auction.html",
  "breeding.html",
  "craft.html",
  "gear.html",
  "chat_global.html",
  "rating_players.html",
]) {
  const body = fs.readFileSync(path.join(DESIGN, "stitch-src", f), "utf8");
  ok(
    `stitch-src/${f} not stub`,
    body.length > 5000 && !body.includes("Нужен мок Stitch"),
  );
}
ok(
  "home still stub (TRUE gap)",
  fs.readFileSync(path.join(DESIGN, "stitch-src", "home.html"), "utf8").includes("Нужен мок Stitch"),
);

let httpOk = false;
try {
  const res = await fetch(`${BASE}/healthz`);
  const data = await res.json();
  httpOk = res.ok && data?.ok === true;
  ok("http /healthz", httpOk, BASE);
  if (httpOk) {
    const page = await fetch(`${BASE}/`);
    const body = await page.text();
    ok("http / serves index", page.ok && body.includes("viewHub"));
    ok(
      "http / is Stitch (not portal-grid restyle)",
      body.includes("cdn.tailwindcss.com") && body.includes("data-stitch="),
    );
    ok("http / has appSubTabs", body.includes('id="appSubTabs"'));
    ok("http / has viewBossRaid", body.includes('id="viewBossRaid"'));
    ok("http / has viewBossDungeon", body.includes('id="viewBossDungeon"'));
    const loc = await fetch(`${BASE}/loc.json`);
    const locJson = await loc.json();
    ok("http /loc.json hub.tab.tavern", !!locJson["hub.tab.tavern"]);
    ok("http /loc.json nav.primary.combat", !!locJson["nav.primary.combat"]);
    ok("http /loc.json Мифмир", locJson["hub.tab.yard"]?.ru === "Мифмир");
    ok("http /loc.json nav.sub.boss_dungeon", !!locJson["nav.sub.boss_dungeon"]);
    const battle = await fetch(`${BASE}/api/battle/healthz`);
    const b = await battle.json();
    ok("proxy battle healthz", battle.ok && b?.ok === true);
    const live = await fetch(`${BASE}/api/liveops/v1/liveops.json`, {
      headers: { "X-Client-Region": "RU" },
    });
    ok("proxy liveops", live.ok);
    const starter = await fetch(`${BASE}/api/dev/starter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "verify_nav" }),
    });
    const kit = await starter.json();
    ok(
      "http GrantStarterKit §5.1",
      starter.ok &&
        kit.fish === 200 &&
        kit.bowls === 3 &&
        kit.pvpTickets === 5 &&
        kit.yarn === 0 &&
        kit.cats?.length === 4 &&
        kit.potions?.length === 6 &&
        kit.gear === null &&
        kit.cats.some((c) => c.templateId === "starter_farm_grass"),
    );
  }
} catch (err) {
  ok("http /healthz", false, String(err.message || err));
}

const failed = checks.filter((c) => !c.pass);
console.log("\n---");
console.log(`Total ${checks.length} · pass ${checks.length - failed.length} · fail ${failed.length}`);
if (failed.length) {
  for (const f of failed) console.log("FAIL detail:", f.name, f.detail);
}
process.exit(failed.length ? 1 : 0);
