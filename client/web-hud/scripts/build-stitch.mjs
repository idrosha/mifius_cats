#!/usr/bin/env node
/**
 * Build Mythfel Web HUD from vendored Stitch HTML (design/stitch-src).
 * Emits public/index.html + public/stitch/*.html partials with real Stitch markup.
 * Interactive smoke controls live in a single #wireDock (unique IDs).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "design", "stitch-src");
const OUT_STITCH = path.join(ROOT, "public", "stitch");
const OUT_INDEX = path.join(ROOT, "public", "index.html");

const SCREENS = [
  { id: "hub", file: "hub.html", view: "viewHub" },
  { id: "yard", file: "yard.html", view: "viewYard" },
  { id: "formation", file: "formation.html", view: "viewFormation" },
  { id: "battle", file: "battle.html", view: "viewBattle" },
  { id: "result_win", file: "result_win.html", view: "viewResultWin" },
  { id: "result_lose", file: "result_lose.html", view: "viewResultLose" },
  { id: "collection", file: "collection.html", view: "viewCollection" },
  { id: "shop", file: "shop.html", view: "viewShop" },
  { id: "market", file: "shop.html", view: "viewMarket" },
  { id: "tavern", file: "tavern.html", view: "viewTavern" },
  { id: "pass", file: "pass.html", view: "viewPass" },
  { id: "pvp", file: "pvp.html", view: "viewPvp" },
  { id: "soon_farm", file: "soon_farm.html", view: "viewSoonFarm" },
  { id: "soon_clan", file: "soon_clan.html", view: "viewSoonClan" },
];

function extractBody(html) {
  const m = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!m) throw new Error("no <body>");
  return m[1].trim();
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
  const section = `<section id="${screen.view}" class="stitch-view hidden" data-stitch="${screen.id}">
${body}
</section>`;
  fs.writeFileSync(path.join(OUT_STITCH, `${screen.id}.html`), section, "utf8");
  sections.push(section);
}

const index = `<!DOCTYPE html>
<html class="dark" lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="shell-type" content="web_standard" />
  <title>Мифиус — Web HUD (Stitch)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@500;600;700&family=Rubik:wght@600;700;800&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script id="tailwind-config">${twConfig}</script>
  <style>${baseStyle}</style>
  <link rel="stylesheet" href="/styles.css" />
</head>
<body class="bg-surface font-body-md text-body-md text-on-surface min-h-screen">
  <div id="hudChrome" aria-label="status">
    <div id="liveopsPill" class="status-pill">LiveOps…</div>
    <div id="battlePill" class="status-pill">Battle…</div>
    <div class="locale-switch" id="localeSwitch"></div>
  </div>
  <div id="toast" class="hidden" role="status"></div>
  <nav id="appTabs" aria-label="Mythfel screens"></nav>

  <main id="app">
    <section id="viewBoot" class="stitch-view panel-boot">
      <div class="boot-card">
        <p class="eyebrow">Boot</p>
        <h2>Мифиус</h2>
        <p class="lead" id="bootMsg">Загрузка LiveOps…</p>
      </div>
    </section>
${sections.join("\n")}
    <!-- Logical aliases kept for verify-nav / app routing -->
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

  <aside id="wireDock" class="mythfel-wire" aria-label="HUD wire controls">
    <div class="mythfel-wire-inner">
      <span class="mythfel-wire-label">HUD</span>
      <button type="button" class="wire-btn" data-for="yard" id="btnTutorial">Туториал → бой</button>
      <button type="button" class="wire-btn" data-for="yard" id="btnYardToFormation">Расстановка</button>
      <button type="button" class="wire-btn" data-for="yard" id="btnYardBattle">Бой во Дворе</button>
      <button type="button" class="wire-btn" data-for="yard" id="btnYardAuto">Автопобеда</button>
      <button type="button" class="wire-btn" data-for="formation" id="btnFormationBattle">В бой</button>
      <button type="button" class="wire-btn" data-for="formation" id="btnFormationYard">Во Двор</button>
      <button type="button" class="wire-btn" data-for="formation" id="btnFormationTavern">В Таверну</button>
      <button type="button" class="wire-btn" data-for="battle" id="btnEndTurn">Конец хода</button>
      <button type="button" class="wire-btn" data-for="battle" id="btnKeep">Keep</button>
      <button type="button" class="wire-btn" data-for="battle" id="btnSurrender">Сдаться</button>
      <button type="button" class="wire-btn" data-for="battle" id="btnBackHub">В хаб</button>
      <button type="button" class="wire-btn" data-for="result" id="btnResultHub">В Хаб</button>
      <button type="button" class="wire-btn" data-for="result" id="btnResultYard">Во Двор</button>
      <button type="button" class="wire-btn" data-for="result" id="btnResultRetry">Повторить</button>
      <button type="button" class="wire-btn" data-for="result" id="btnResultFormation">Расстановка</button>
      <button type="button" class="wire-btn" data-for="collection" id="btnColFormation">Расстановка</button>
      <button type="button" class="wire-btn" data-for="collection" id="btnColForge">Оружейная → Скоро</button>
      <button type="button" class="wire-btn" data-for="shop" id="btnShopToTavern">В Таверну</button>
      <button type="button" class="wire-btn" data-for="shop" id="btnGacha1">Гача ×1</button>
      <button type="button" class="wire-btn" data-for="shop" id="btnGacha10">Гача ×10</button>
      <button type="button" class="wire-btn" data-for="market" id="btnSellStarter">Выставить starter</button>
      <button type="button" class="wire-btn" data-for="market" id="btnMarketToShop">В Лавку</button>
      <button type="button" class="wire-btn" data-for="tavern" id="btnTavernFormation">К расстановке</button>
      <button type="button" class="wire-btn" data-for="tavern" id="btnTavernHub">В Хаб</button>
      <button type="button" class="wire-btn" data-for="pass" id="btnPassShop">В Лавку</button>
      <button type="button" class="wire-btn" data-for="pass" id="btnPassHub">В Хаб</button>
      <button type="button" class="wire-btn" data-for="pvp" id="btnPvpAuto">Автобой PvP</button>
      <button type="button" class="wire-btn" data-for="pvp" id="btnPvpFormation">Расстановка</button>
      <button type="button" class="wire-btn" data-for="pvp" id="btnRefreshReplays">Реплеи</button>
      <button type="button" class="wire-btn" data-for="soon" id="btnSoonHub">В Хаб</button>
      <div id="shopSubtabs" class="hidden"></div>
      <div id="marketSubtabs" class="hidden"></div>
      <div id="gachaPanel" class="hidden"><h3 id="gachaTitle"></h3><p id="gachaLead"></p></div>
      <div id="marketSell" class="hidden"><p id="sellLead"></p></div>
      <div id="tutorialBanner" class="banner warn hidden"></div>
      <div id="resultBanner" class="banner hidden"></div>
      <p class="eyebrow hidden" id="resultEyebrow"></p>
      <h2 class="hidden" id="resultTitle"></h2>
      <p class="hidden" id="resultLead"></p>
      <p class="hidden" id="hubEyebrow"></p>
      <h2 class="hidden" id="hubTitle"></h2>
      <p class="hidden" id="hubLead"></p>
      <div class="hidden" id="hubPortals"></div>
      <p class="hidden" id="yardEyebrow"></p>
      <h2 class="hidden" id="yardTitle"></h2>
      <p class="hidden" id="yardLead"></p>
      <p class="hidden" id="formEyebrow"></p>
      <h2 class="hidden" id="formTitle"></h2>
      <p class="hidden" id="formLead"></p>
      <p class="hidden" id="colEyebrow"></p>
      <h2 class="hidden" id="colTitle"></h2>
      <p class="hidden" id="colLead"></p>
      <p class="hidden" id="shopEyebrow"></p>
      <h2 class="hidden" id="shopTitle"></h2>
      <p class="hidden" id="shopLead"></p>
      <p class="hidden" id="marketEyebrow"></p>
      <h2 class="hidden" id="marketTitle"></h2>
      <p class="hidden" id="marketLead"></p>
      <p class="hidden" id="tavernEyebrow"></p>
      <h2 class="hidden" id="tavernTitle"></h2>
      <p class="hidden" id="tavernLead"></p>
      <span class="hidden" id="drinksLabel"></span>
      <span class="hidden" id="potionsLabel"></span>
      <div class="hidden" id="drinkList"></div>
      <div class="hidden" id="potionList"></div>
      <p class="hidden" id="passEyebrow"></p>
      <h2 class="hidden" id="passTitle"></h2>
      <p class="hidden" id="passLead"></p>
      <p class="hidden" id="pvpEyebrow"></p>
      <h2 class="hidden" id="pvpTitle"></h2>
      <p class="hidden" id="pvpLead"></p>
      <h2 class="hidden" id="battleHeading"></h2>
      <span class="hidden" id="brandSub"></span>
      <span class="hidden" id="curGold"></span>
      <span class="hidden" id="curMilk"></span>
      <span class="hidden" id="curEnergy"></span>
      <span class="hidden" id="curGems"></span>
      <div class="wire-panel" data-for="yard"><div class="card-grid" id="starterCards"></div></div>
      <div class="wire-panel" data-for="formation">
        <div class="formation-lanes" id="formationLanes"></div>
        <div class="potion-tray" id="formationPotions"></div>
      </div>
      <div class="wire-panel" data-for="battle">
        <div class="mythfel-battle-stats" id="battleStats"></div>
        <div class="mythfel-board">
          <div><div class="meta">Враги</div><div class="lane-row" id="enemyBoard"></div></div>
          <div><div class="meta">Союзники</div><div class="lane-row" id="allyBoard"></div></div>
        </div>
        <div class="mythfel-hand" id="hand"></div>
        <pre class="mythfel-log" id="battleLog"></pre>
      </div>
      <div class="wire-panel" data-for="collection"><div class="card-grid" id="collectionCards"></div></div>
      <div class="wire-panel" data-for="shop"><ul class="offer-list" id="offerList"></ul></div>
      <div class="wire-panel" data-for="market"><ul class="offer-list" id="marketList"></ul></div>
      <div class="wire-panel" data-for="pass"><ul class="offer-list" id="passList"></ul></div>
      <div class="wire-panel" data-for="pvp">
        <ul class="replay-list" id="replayList"></ul>
        <pre class="mythfel-log" id="pvpLog"></pre>
      </div>
    </div>
  </aside>

  <nav id="hubTabs" class="hidden" aria-hidden="true"></nav>
  <script type="module" src="/app.js"></script>
  <!-- window.mythfelNavigate(tab) exposed by app.js for QA -->
</body>
</html>
`;

fs.writeFileSync(OUT_INDEX, index, "utf8");
console.log(
  `built ${SCREENS.length} stitch screens → ${path.relative(process.cwd(), OUT_INDEX)} (${Math.round(index.length / 1024)} KiB)`,
);
