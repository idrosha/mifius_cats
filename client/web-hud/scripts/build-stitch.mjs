#!/usr/bin/env node
/**
 * Build Mythfel Web HUD from vendored Stitch HTML (design/stitch-src).
 * Packs 0268 + 64d5 + battles e608/4da7/18c7 + ba17 + 17eb — partial IA coverage; missing routes get empty hosts.
 * Emits public/index.html + public/stitch/*.html partials.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "design", "stitch-src");
const OUT_STITCH = path.join(ROOT, "public", "stitch");
const OUT_INDEX = path.join(ROOT, "public", "index.html");

/** Screens present in packs 0268 / 64d5 / e608 / 4da7 */
const SCREENS = [
  { id: "hub", file: "hub.html", view: "viewHub" },
  { id: "login", file: "login.html", view: "viewLogin" },
  { id: "collection", file: "collection.html", view: "viewCollection" },
  { id: "armor_sets", file: "armor_sets.html", view: "viewArmorSets" },
  { id: "gear", file: "gear.html", view: "viewGear" },
  { id: "class_sets", file: "class_sets.html", view: "viewClassSets" },
  { id: "home", file: "home.html", view: "viewHome" }, // Дом Хранителя: кот + экип + инвентарь
  { id: "breeding", file: "breeding.html", view: "viewBreeding" },
  { id: "craft", file: "craft.html", view: "viewCraft" },
  { id: "codex", file: "codex.html", view: "viewCodex" },
  { id: "heroes", file: "heroes.html", view: "viewHeroes" },
  { id: "soon_farm", file: "soon_farm.html", view: "viewSoonFarm" },
  // Battles packs e608 + 4da7
  { id: "yard", file: "yard.html", view: "viewYard" },
  { id: "formation", file: "formation.html", view: "viewFormation" }, // inline, not Бои subtab
  { id: "battle", file: "battle.html", view: "viewBattle" },
  { id: "result_win", file: "result_win.html", view: "viewResultWin" },
  { id: "boss_dungeon", file: "boss_dungeon.html", view: "viewBossDungeon" },
  { id: "boss_raid", file: "boss_raid.html", view: "viewBossRaid" },
  { id: "pvp", file: "pvp.html", view: "viewPvp" },
  { id: "guild_battle", file: "guild_battle.html", view: "viewGuildBattle" },
  // Battles pack 18c7 — practice fight + guild hall
  { id: "practice", file: "practice.html", view: "viewPractice" },
  { id: "guild", file: "guild.html", view: "viewGuild" },
  // Pack ba17 — battle pass + chats (one layout ×3 channels)
  { id: "pass", file: "pass.html", view: "viewPass" },
  { id: "chat_global", file: "chat_global.html", view: "viewChatGlobal" },
  { id: "chat_guild", file: "chat_guild.html", view: "viewChatGuild" },
  { id: "chat_friends", file: "chat_friends.html", view: "viewChatFriends" },
  // Pack 17eb — trade menus + ratings (ratings share one layout ×2)
  { id: "tavern", file: "tavern.html", view: "viewTavern" },
  { id: "shop", file: "shop.html", view: "viewShop" },
  { id: "market", file: "market.html", view: "viewMarket" },
  { id: "auction", file: "auction.html", view: "viewAuction" },
  { id: "rating_players", file: "rating_players.html", view: "viewRatingPlayers" },
  { id: "rating_guilds", file: "rating_guilds.html", view: "viewRatingGuilds" },
  // Working transition forms (HUD-owned; not raw Stitch packs)
  { id: "result_lose", file: "result_lose.html", view: "viewResultLose" },
  { id: "equip_cards", file: "equip_cards.html", view: "viewEquipCards" },
  { id: "soon_clan", file: "soon_clan.html", view: "viewSoonClan" },
];

/** Reserved — keep empty list so IA never drops a route silently */
const PLACEHOLDERS = [];

function extractBody(html) {
  const m = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!m) throw new Error("no <body>");
  // Strip inline scripts: many Stitch screens redeclare the same const/ids
  // (e.g. rollDiceBtn ×3 chats) which throws once concatenated into index.html.
  // Behavior lives in public/app.js.
  return m[1]
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<script\b[^>]*\/>/gi, "")
    .trim();
}

function extractTailwindConfig(html) {
  const m = html.match(/<script id="tailwind-config">([\s\S]*?)<\/script>/i);
  return m ? m[1].trim() : null;
}

function extractStyleBlock(html) {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((m) => m[1])
    .join("\n");
}

fs.mkdirSync(OUT_STITCH, { recursive: true });

const hubHtml = fs.readFileSync(path.join(SRC, "hub.html"), "utf8");
const twConfig =
  extractTailwindConfig(hubHtml) ||
  `tailwind.config={darkMode:"class",theme:{extend:{}}};`;
const baseStyle = extractStyleBlock(hubHtml);

const sections = [];
for (const screen of SCREENS) {
  const raw = fs.readFileSync(path.join(SRC, screen.file), "utf8");
  const body = extractBody(raw);
  const section = `<section id="${screen.view}" class="stitch-view mythfel-form hidden" data-stitch="${screen.id}" data-layout="landscape">
${body}
</section>`;
  fs.writeFileSync(path.join(OUT_STITCH, `${screen.id}.html`), section, "utf8");
  sections.push(section);
}

for (const ph of PLACEHOLDERS) {
  const section = `<section id="${ph.view}" class="stitch-view mythfel-form hidden hud-placeholder" data-stitch="${ph.id}" data-placeholder="1" data-layout="landscape">
  <div class="boot-card">
    <p class="eyebrow">Скоро · Stitch</p>
    <h2>${ph.label}</h2>
    <p class="lead muted">Форма IA есть в меню; painted mock ещё не в паках 0268/64d5/e608/4da7/18c7/ba17/17eb.</p>
  </div>
</section>`;
  fs.writeFileSync(path.join(OUT_STITCH, `${ph.id}.html`), section, "utf8");
  sections.push(section);
}

const wireFragPath = path.join(__dirname, "wire-dock.fragment.html");
const wireFromIndex = fs.readFileSync(OUT_INDEX, "utf8").match(/<aside id="wireDock"[\s\S]*?<\/aside>/i)?.[0];
const wireBlock =
  (fs.existsSync(wireFragPath) && fs.readFileSync(wireFragPath, "utf8").trim()) ||
  wireFromIndex ||
  `<aside id="wireDock" class="mythfel-wire" aria-label="HUD wire controls"><div class="mythfel-wire-inner"></div></aside>`;

const index = `<!DOCTYPE html>
<html class="dark" lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="shell-type" content="web_standard" />
  <meta name="hud-ui" content="stitch-0268-64d5-e608-4da7-18c7" />
  <meta name="hud-layout" content="landscape-flush" />
  <title>Мифиус — Web HUD (Stitch)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Nunito+Sans:wght@500;600;700&family=Rubik:wght@600;700;800&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script id="tailwind-config">${twConfig}</script>
  <style>${baseStyle}</style>
  <link rel="stylesheet" href="/styles.css" />
</head>
<body class="bg-surface font-body-md text-body-md text-on-surface mythfel-shell">
  <header id="appNav" class="mythfel-nav" aria-label="Mythfel navigation">
    <div class="mythfel-nav-top">
      <button type="button" class="mythfel-brand" id="btnBrandHub" title="Хаб">
        <span class="mythfel-brand-mark" aria-hidden="true">🐾</span>
        <span class="mythfel-brand-text">
          <strong>МИФИУС</strong>
          <span id="brandSub">Ур. 1 · Soft Launch</span>
        </span>
      </button>
      <nav id="appTabs" class="mythfel-primary" aria-label="Основные разделы"></nav>
      <div id="hudChrome" class="mythfel-chrome" aria-label="status">
        <div id="liveopsPill" class="status-pill">LiveOps…</div>
        <div id="battlePill" class="status-pill">Battle…</div>
        <div class="locale-switch" id="localeSwitch"></div>
      </div>
    </div>
    <nav id="appSubTabs" class="mythfel-subtabs" aria-label="Подразделы"></nav>
  </header>

  <div id="toast" class="hidden" role="status"></div>

  <main id="app">
    <section id="viewBoot" class="stitch-view panel-boot">
      <div class="boot-card">
        <p class="eyebrow">Boot</p>
        <h2>Мифиус</h2>
        <p class="lead" id="bootMsg">Загрузка LiveOps…</p>
      </div>
    </section>
${sections.join("\n")}
    <section id="viewResult" class="stitch-view hidden" data-alias="result"></section>
    <section id="viewSoon" class="stitch-view hidden" data-alias="soon">
      <div class="boot-card">
        <p class="eyebrow">Скоро</p>
        <h2 id="soonTitle">Скоро</h2>
        <p id="soonBody">Скоро</p>
        <div class="soon-links" id="soonLinks"></div>
      </div>
    </section>
  </main>

  ${wireBlock}

  <nav id="hubTabs" class="hidden" aria-hidden="true"></nav>
  <script type="module" src="/app.js"></script>
</body>
</html>
`;

fs.writeFileSync(OUT_INDEX, index, "utf8");
console.log(
  `built ${SCREENS.length} stitch + ${PLACEHOLDERS.length} placeholders → ${path.relative(process.cwd(), OUT_INDEX)} (${Math.round(index.length / 1024)} KiB)`,
);
