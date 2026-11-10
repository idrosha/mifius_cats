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
  // Practice/PvE victory hall (painted) — shown after p1_win
  { id: "victory_hall", file: "victory_hall.html", view: "viewVictoryHall" },
  { id: "boss_dungeon", file: "boss_dungeon.html", view: "viewBossDungeon" },
  { id: "boss_raid", file: "boss_raid.html", view: "viewBossRaid" },
  { id: "pvp", file: "pvp.html", view: "viewPvp" },
  { id: "guild_battle", file: "guild_battle.html", view: "viewGuildBattle" },
  // Live Бои hub (/fronts) — battle frontiers map
  { id: "battle_hub", file: "battle_hub.html", view: "viewBattleHub" },
  // Battles pack 18c7 — practice lobby + guild hall
  { id: "practice", file: "practice.html", view: "viewPractice" },
  // Dojo sparring fight form (Stitch battle HUD; no top nav during fight)
  { id: "practice_fight", file: "practice_fight.html", view: "viewPracticeFight" },
  { id: "guild", file: "guild.html", view: "viewGuild" },
  // Pack ba17 — battle pass + chats (one layout ×3 channels)
  { id: "pass", file: "pass.html", view: "viewPass" },
  { id: "chat_global", file: "chat_global.html", view: "viewChatGlobal" },
  { id: "chat_guild", file: "chat_guild.html", view: "viewChatGuild" },
  { id: "chat_friends", file: "chat_friends.html", view: "viewChatFriends" },
  // Pack 17eb — trade menus + ratings (ratings share one layout ×2)
  { id: "trade_hub", file: "trade_hub.html", view: "viewTradeHub" },
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
        <div class="mythfel-social" aria-label="Соцсети">
          <a class="mythfel-social-btn" id="btnSocialTg" href="https://t.me/" target="_blank" rel="noopener noreferrer" title="Telegram" aria-label="Telegram">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8-1.55 7.3c-.12.54-.43.67-.87.42l-2.4-1.77-1.16 1.12c-.13.13-.24.24-.49.24l.17-2.43 4.43-4.01c.19-.17-.04-.27-.3-.1l-5.48 3.45-2.36-.74c-.51-.16-.52-.51.11-.76l9.22-3.55c.43-.16.8.1.68.63z"/></svg>
          </a>
          <a class="mythfel-social-btn" id="btnSocialVk" href="https://vk.com/" target="_blank" rel="noopener noreferrer" title="VK" aria-label="VK">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M12.63 16.95h-.97s-1.72-.2-3.23-2.16C6.7 12.6 5.4 9.14 5.4 9.14s-.08-.22.05-.33c.16-.13.58-.13.58-.13l2.05.01s.19.03.33.16c.12.11.18.29.18.29s.34.92.8 1.74c.88 1.58 1.28 1.92 1.58 1.75.43-.24.3-2.21.3-2.21s.01-.71-.22-.99c-.18-.22-.52-.28-.67-.3-.12-.02.08-.28.34-.4.31-.14.86-.15 1.51-.14.5.01.65.04.84.09.44.13.42.45.39 1.28l-.02 1.95c-.03.55.13.66.42.61.27-.05 1.54-1.71 2.46-3.41.38-.7.66-1.26.66-1.26s.08-.17.21-.24c.14-.07.33-.05.33-.05h2.17s.65-.07.76.24c.12.32-.13.97-1.2 2.35-.9 1.16-1.35 1.91-1.33 2.48.01.45.45.69 1.03 1.31.92.97 1.28 1.71 1.38 1.93.27.56-.15.85-.15.85h-1.94s-.34.04-.63-.21c-.25-.21-.61-.74-1.26-1.67-.62-.89-.89-.99-1.16-.96-.38.04-.29.43-.29.43v1.66s-.04.63-.37.76c-.33.13-.78.04-1.8-.01z"/></svg>
          </a>
        </div>
        <button type="button" class="mythfel-logout" id="btnLogout" title="Выйти">Logout</button>
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
