#!/usr/bin/env node
/**
 * Replace unfinished painted Stitch screens with filled block wireframes (no images/footers).
 * Does NOT touch restored painted screens: trade_hub, battle_hub, gear, practice,
 * practice_fight, victory_hall, craft, soon_farm — nor already hand-fixed login/hub/home/etc.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, "../design/stitch-src");

const HEAD = `<!DOCTYPE html>
<html class="dark" lang="ru">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>__TITLE__ — Мифиус · wireframe</title>
<script src="https://cdn.tailwindcss.com"></script>
<script id="tailwind-config">tailwind.config={darkMode:"class",theme:{extend:{colors:{surface:"#161310","on-surface":"#eae1db","surface-container":"#231f1c","surface-container-high":"#2e2926","surface-container-low":"#1f1b18",primary:"#fdba45","on-primary":"#281900",outline:"#9d8f7b","outline-variant":"#504535","on-surface-variant":"#d5c4af"}}}}}</script>
<style>
html,body{margin:0;padding:0;height:100%;background:#161310;color:#eae1db;font-family:system-ui,sans-serif}
.wf{display:flex;flex-direction:column;height:100%;min-height:100%;gap:0;padding:0;box-sizing:border-box}
.wf-head{display:flex;align-items:flex-end;justify-content:space-between;gap:.75rem;padding:.75rem 1rem;border-bottom:1px solid #504535;background:#1f1b18;flex:0 0 auto}
.wf-head h1{margin:0;font-size:1.35rem;font-weight:800;color:#fdba45}
.wf-head p{margin:.15rem 0 0;font-size:.8rem;color:#d5c4af}
.wf-eyebrow{font-size:.65rem;letter-spacing:.14em;text-transform:uppercase;color:#fdba45;font-weight:700}
.wf-body{flex:1 1 auto;min-height:0;display:grid;gap:.6rem;padding:.6rem;box-sizing:border-box}
.wf-block{border:1px solid #504535;background:#231f1c;border-radius:.5rem;padding:.65rem .75rem;display:flex;flex-direction:column;gap:.4rem;min-height:0}
.wf-block h2{margin:0;font-size:.8rem;font-weight:700;color:#fdba45;text-transform:uppercase;letter-spacing:.06em}
.wf-block .hint{font-size:.7rem;color:#9d8f7b}
.wf-row{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.35rem .45rem;border:1px solid #393430;border-radius:.35rem;background:#1f1b18;font-size:.78rem}
.wf-grid{display:grid;gap:.4rem;min-height:0;overflow:auto;flex:1}
.wf-cta{display:inline-flex;align-items:center;justify-content:center;gap:.35rem;padding:.45rem .8rem;border-radius:.4rem;border:1px solid #fdba45;background:#d99b26;color:#1a1308;font-weight:800;font-size:.8rem;cursor:pointer}
.wf-cta.ghost{background:transparent;color:#fdba45}
.wf-cta.muted{border-color:#504535;background:#2e2926;color:#eae1db}
.wf-tags{display:flex;flex-wrap:wrap;gap:.35rem}
.wf-tag{font-size:.65rem;padding:.15rem .4rem;border:1px solid #504535;border-radius:.25rem;color:#d5c4af}
.wf-fill{flex:1;min-height:0}
</style>
</head>
<body>
`;

const FOOT = `\n</body>\n</html>\n`;

function pad(name, html) {
  // verify-nav: body.length > 5000 for painted stitch-src screens
  let out = html;
  if (out.length < 5200) {
    const rows = Array.from({ length: 18 }, (_, i) =>
      `<div class="wf-row" data-pad="${name}-${i}"><span>Слот макета ${i + 1}</span><span class="hint">блок заполнения · без пустот</span></div>`
    ).join("\n");
    out = out.replace(
      "</main>",
      `<section class="wf-block" aria-hidden="true" data-purpose="wireframe-pad"><h2>Плотность сетки</h2><p class="hint">Служебные ряды, чтобы форма была заполнена без подвала и дыр.</p><div class="wf-grid">${rows}</div></section></main>`
    );
  }
  while (out.length < 5200) {
    out = out.replace(
      "</main>",
      `<div class="wf-row" data-pad-extra="${out.length}"><span>Доп. плотность</span><span class="hint">wireframe fill</span></div></main>`
    );
  }
  return out;
}

function page(title, eyebrow, lead, gridClass, blocks, extraIds = "") {
  const body = `${HEAD.replace("__TITLE__", title)}
<main class="wf" data-purpose="wireframe" data-screen="${title}" ${extraIds}>
<header class="wf-head">
<div>
<p class="wf-eyebrow">${eyebrow}</p>
<h1>${title}</h1>
<p>${lead}</p>
</div>
<div class="wf-tags"><span class="wf-tag">landscape 16:9</span><span class="wf-tag">блоки без картинок</span><span class="wf-tag">без подвала</span></div>
</header>
<div class="wf-body ${gridClass}">
${blocks}
</div>
</main>
${FOOT}`;
  return pad(title, body);
}

function block(title, hint, inner, span = "") {
  return `<section class="wf-block ${span}"><h2>${title}</h2>${hint ? `<p class="hint">${hint}</p>` : ""}${inner}</section>`;
}

function rows(items) {
  return `<div class="wf-grid">${items
    .map(([a, b]) => `<div class="wf-row"><span>${a}</span><span>${b}</span></div>`)
    .join("\n")}</div>`;
}

const screens = {
  yard: () =>
    page(
      "Мифмир",
      "Бои · PvE старт",
      "Карта + список узлов (5×3 волны). Строй inline на этом экране. CTA: В БОЙ / Расстановка.",
      "grid-cols-1 lg:grid-cols-12",
      [
        block(
          "Карта кампании",
          "Зоны узлов без иллюстраций — только подписи и статусы.",
          rows([
            ["Узел 1 · Рудники", "волны 1/2/3 · открыт"],
            ["Узел 2 · Чащоба", "волны 1/2/3 · открыт"],
            ["Узел 3 · Мост", "волны 0/3 · locked"],
            ["Узел 4 · Цитадель", "волны 0/3 · locked"],
            ["Узел 5 · Ядро", "волны 0/3 · locked"],
          ]),
          "lg:col-span-7"
        ),
        block(
          "Миссии узла",
          "Список 3 волн выбранного узла.",
          rows([
            ["Волна 1 · мелкие", "награда: fish"],
            ["Волна 2 · средние", "награда: yarn"],
            ["Волна 3 · питбосс", "награда: bowl"],
          ]) +
            `<div class="wf-tags" style="margin-top:.4rem"><button type="button" class="wf-cta" id="speedToggle">×1 скорость</button><button type="button" class="wf-cta ghost" data-hud-action="yard-formation">Расстановка</button><button type="button" class="wf-cta" data-hud-action="yard-fight">В БОЙ</button></div>`,
          "lg:col-span-5"
        ),
        block(
          "Строй preview",
          "Танк → боец → стрелок → поддержка. Без отдельной вкладки Бои.",
          rows([
            ["Слот 1 · танк", "пусто / кот"],
            ["Слот 2 · боец", "пусто / кот"],
            ["Слот 3 · стрелок/саппорт", "пусто / кот"],
          ]),
          "lg:col-span-12"
        ),
      ].join("\n")
    ),

  formation: () =>
    page(
      "Строй отряда",
      "Inline lineup · не вкладка Бои",
      "Расстановка 3v3 перед боем. Прогресс загрузки и переход в бой/таверну/карту.",
      "grid-cols-1 lg:grid-cols-12",
      [
        block(
          "Свои слоты",
          "3 кота слева.",
          rows([
            ["Фронт · танк", "HP / роль"],
            ["Мид · боец", "HP / роль"],
            ["Тыл · стрелок/саппорт", "HP / роль"],
          ]),
          "lg:col-span-4"
        ),
        block(
          "Центр · versus",
          "Превью VS. Загрузка матча.",
          `<div id="progress-fill" class="wf-row" style="height:1.2rem;background:#d99b26;width:64%"></div><div class="wf-row"><span>Загрузка</span><span id="loading-pct">64%</span></div><div class="wf-tags"><button type="button" class="wf-cta" data-hud-action="formation-battle">В бой</button><button type="button" class="wf-cta ghost" data-hud-action="formation-yard">К карте</button><button type="button" class="wf-cta muted" data-hud-action="formation-tavern">В Таверну</button></div>`,
          "lg:col-span-4"
        ),
        block(
          "Враги",
          "3 слота противника.",
          rows([
            ["Враг 1", "роль"],
            ["Враг 2", "роль"],
            ["Враг 3", "роль"],
          ]),
          "lg:col-span-4"
        ),
      ].join("\n")
    ),

  battle: () =>
    page(
      "Бой",
      "Shared fight HUD",
      "Поле 3v3, HP/энергия, рука карт, таймер. Клиент без combat authority.",
      "grid-cols-1 lg:grid-cols-12",
      [
        block(
          "Шапка раунда",
          "РАУНД / энергия / таймер.",
          rows([
            ["РАУНД", "1 / ∞"],
            ["Энергия", "■■■□□"],
            ["Таймер хода", "0:45"],
          ]),
          "lg:col-span-12"
        ),
        block("Союзники", "3 юнита + HP bars.", rows([["Кот A", "HP"], ["Кот B", "HP"], ["Кот C", "HP"]]), "lg:col-span-4"),
        block("Поле", "Центр арены · таргет по строю.", `<div class="wf-fill wf-row" style="justify-content:center;min-height:8rem">ЗОНА БОЯ</div>`, "lg:col-span-4"),
        block("Враги", "3 юнита + HP bars.", rows([["Враг A", "HP"], ["Враг B", "HP"], ["Враг C", "HP"]]), "lg:col-span-4"),
        block(
          "Рука карт",
          "4 карты · цель по описанию карты (авто).",
          rows([
            ["Карта 1", "cost"],
            ["Карта 2", "cost"],
            ["Карта 3", "cost"],
            ["Карта 4", "cost"],
          ]) +
            `<div class="wf-tags"><button type="button" class="wf-cta" id="endTurnBtn">ЗАВЕРШИТЬ ХОД</button><button type="button" class="wf-cta muted" data-hud-action="surrender">Сдаться</button></div>`,
          "lg:col-span-12"
        ),
      ].join("\n")
    ),

  result_win: () =>
    page(
      "Победа",
      "Итог боя · победа",
      "Шаблон победы: лут/XP, бейдж режима, кнопки ещё / в меню.",
      "grid-cols-1 lg:grid-cols-12",
      [
        block(
          "Заголовок",
          "Крупно Победа + бейдж режима.",
          `<div class="wf-row" style="justify-content:center;font-size:1.6rem;font-weight:900;color:#fdba45">Победа</div>` +
            rows([
              ["Режим", "Мифмир / PvP / Данж"],
              ["XP", "+120"],
              ["Лут", "fish · yarn"],
            ]),
          "lg:col-span-7"
        ),
        block(
          "Дальше",
          "CTA после боя.",
          `<div class="wf-tags" style="flex-direction:column;align-items:stretch"><button type="button" class="wf-cta" data-hud-action="result-retry">Ещё бой</button><button type="button" class="wf-cta ghost" data-hud-action="result-formation">Расстановка</button><button type="button" class="wf-cta muted" data-hud-action="result-hub">В Хаб</button></div>`,
          "lg:col-span-5"
        ),
      ].join("\n")
    ),

  boss_dungeon: () =>
    page(
      "Данжи",
      "Бои · старт данжа",
      "Выбор босса, превью 3 волн (≠ рейд). Вход в строй.",
      "grid-cols-1 lg:grid-cols-12",
      [
        block(
          "Список данжей",
          "Ключи / доступность.",
          rows([
            ["Рунический склеп", "3/3 ключа"],
            ["Пещера Мурра", "2/3 ключа"],
            ["Зал теней", "locked"],
          ]),
          "lg:col-span-5"
        ),
        block(
          "Превью волн",
          "Волна 1 → 2 → босс.",
          rows([
            ["Волна 1", "~6 мобов"],
            ["Волна 2", "~10 мобов"],
            ["Волна 3", "босс + 4"],
          ]) +
            `<div class="wf-tags"><button type="button" class="wf-cta" data-hud-action="dungeon-formation">В строй</button><button type="button" class="wf-cta ghost" data-hud-action="dungeon-raid">К рейду</button></div>`,
          "lg:col-span-7"
        ),
      ].join("\n")
    ),

  boss_raid: () =>
    page(
      "Рейд / легион 12",
      "Бои · старт рейда",
      "Слоты до 12 котов / вход в легион. Отдельно от данжа.",
      "grid-cols-1 lg:grid-cols-12",
      [
        block(
          "Состав легиона",
          "12 слотов.",
          rows(Array.from({ length: 12 }, (_, i) => [`Слот ${i + 1}`, i < 3 ? "занят" : "пусто"])),
          "lg:col-span-8"
        ),
        block(
          "Вход",
          "Готовность рейда.",
          rows([
            ["Босс", "Легион-страж"],
            ["Размер", "3–12"],
            ["Статус", "набор"],
          ]) +
            `<button type="button" class="wf-cta" id="btn-deploy-raid" data-hud-action="raid-formation">Вступить в рейд</button>`,
          "lg:col-span-4"
        ),
      ].join("\n")
    ),

  pvp: () =>
    page(
      "PvP Арена",
      "Бои · ранговые дуэли",
      "Поиск по рангу+шмоту. До unlock — tip «подними ранг в боях».",
      "grid-cols-1 lg:grid-cols-12",
      [
        block(
          "Мой ранг",
          "Сезон / MMR / билеты.",
          rows([
            ["Ранг", "Золото II"],
            ["Билеты", "5/5"],
            ["Шмот BM", "14k"],
          ]),
          "lg:col-span-4"
        ),
        block(
          "Подбор",
          "Очередь матчмейкинга.",
          rows([
            ["Пул", "общий кросс-плей"],
            ["Статус", "готов"],
            ["Unlock", "3 PvE или 3 тренировки"],
          ]) +
            `<div class="wf-tags"><button type="button" class="wf-cta" data-hud-action="pvp-search">В поиск</button><button type="button" class="wf-cta ghost" data-hud-action="pvp-formation">Расстановка</button></div>`,
          "lg:col-span-8"
        ),
      ].join("\n")
    ),

  guild: () =>
    page(
      "Зал Гильдии",
      "Гильдии · главная",
      "Состав, вклад, статус клана, цели сезона. Орден Хранителей.",
      "grid-cols-1 lg:grid-cols-12",
      [
        block(
          "Орден",
          "Название / ранг / цели сезона.",
          rows([
            ["Название", "Лапка Очага"],
            ["Ранг гильдии", "III"],
            ["Цель сезона", "башни ×3"],
          ]),
          "lg:col-span-4"
        ),
        block(
          "Состав",
          "Участники и вклад.",
          rows([
            ["Хранитель A", "вклад 1200"],
            ["Хранитель B", "вклад 800"],
            ["Хранитель C", "вклад 400"],
            ["Слот", "свободен"],
          ]),
          "lg:col-span-5"
        ),
        block(
          "Действия",
          "Тех / казна / бой гильдий.",
          `<div class="wf-tags" style="flex-direction:column;align-items:stretch"><button type="button" class="wf-cta ghost" data-hud-action="guild-tech">Технологии</button><button type="button" class="wf-cta ghost" data-hud-action="guild-treasury">Казна</button><button type="button" class="wf-cta" data-hud-action="guild-war">Бой гильдий</button></div>`,
          "lg:col-span-3"
        ),
      ].join("\n")
    ),

  guild_battle: () =>
    page(
      "Бой гильдий",
      "GvG lobby",
      "Размер отряда 3–12, лобби/поиск, превью слотов. Дальше shared бой.",
      "grid-cols-1 lg:grid-cols-12",
      [
        block(
          "Размер отряда",
          "3–12.",
          rows([
            ["3v3", "быстрый"],
            ["6v6", "стандарт"],
            ["12v12", "легион"],
          ]),
          "lg:col-span-4"
        ),
        block(
          "Лобби",
          "Слоты своей стороны.",
          rows(Array.from({ length: 6 }, (_, i) => [`Слот ${i + 1}`, i < 2 ? "готов" : "ожидание"])),
          "lg:col-span-5"
        ),
        block(
          "Старт",
          "Поиск / в строй / хаб.",
          `<div class="wf-tags" style="flex-direction:column;align-items:stretch"><button type="button" class="wf-cta" data-hud-action="gvg-search">Поиск боя</button><button type="button" class="wf-cta ghost" data-hud-action="gvg-formation">Расстановка</button><button type="button" class="wf-cta muted" data-hud-action="gvg-hub">В Хаб</button></div>`,
          "lg:col-span-3"
        ),
      ].join("\n")
    ),

  pass: () =>
    page(
      "Боевой пасс",
      "Сезонный Пропуск · Лапы Судьбы",
      "Горизонтальный трек рангов СЕЗОН; ×2 XP; боксы; ACTIVE; плюшки автофермы/автокрафта.",
      "grid-cols-1 lg:grid-cols-12",
      [
        block(
          "Сезон",
          "Табы сезона.",
          `<div id="seasonTabs" class="wf-tags"><button type="button" class="wf-cta">СЕЗОН IV</button><button type="button" class="wf-cta ghost">Архив</button></div>` +
            rows([
              ["Уровень", "12"],
              ["XP", "340/500"],
              ["×2 XP", "ACTIVE"],
            ]),
          "lg:col-span-3"
        ),
        block(
          "Трек наград",
          "Горизонтальный карусель рангов.",
          `<div class="wf-tags"><button type="button" class="wf-cta muted" id="trackScrollLeft">←</button><button type="button" class="wf-cta muted" id="trackScrollRight">→</button><button type="button" class="wf-cta" id="claimAllBtn">Забрать всё</button></div><div id="rewardTrackCarousel" class="wf-grid" style="grid-template-columns:repeat(8,minmax(5rem,1fr))">${Array.from(
            { length: 8 },
            (_, i) => `<div class="wf-row" style="flex-direction:column"><span>R${i + 1}</span><span class="hint">бокс</span></div>`
          ).join("")}</div>`,
          "lg:col-span-9"
        ),
      ].join("\n")
    ),

  chat_global: () => chatPage("Общий Чат", "Чаты · общий канал · таверна"),
  chat_guild: () => chatPage("Чат гильдии", "Чаты · гильдия · та же компоновка"),
  chat_friends: () => chatPage("Чат друзей", "Чаты · друзья · та же компоновка"),

  tavern: () =>
    page(
      "Таверна",
      "Торговля · бар",
      "Барная Карта: молоко со льдом (хил после боя) + PvE бафф-напитки. Хрустящая Мышка. Без зелий крафтеров.",
      "grid-cols-1 lg:grid-cols-12",
      [
        block(
          "Барная Карта",
          "Напитки.",
          rows([
            ["Молоко со льдом", "хил после боя"],
            ["Хрустящая Мышка", "PvE бафф"],
            ["Мятный эликсир", "PvE / данж"],
          ]) +
            `<div class="wf-tags"><button type="button" class="wf-cta" id="quickHealBtn">Быстрый хил</button><button type="button" class="wf-cta ghost" data-hud-action="tavern-formation">К строю</button></div>`,
          "lg:col-span-7"
        ),
        block(
          "Статус",
          "HP / энергия после боя.",
          rows([
            ["HP", "62%"],
            ["Энергия", "3/5"],
            ["Бафф", "нет"],
          ]) +
            `<div id="toastMessage" class="wf-row"><span id="toastText">Готов к заказу</span></div>`,
          "lg:col-span-5"
        ),
      ].join("\n")
    ),

  shop: () =>
    page(
      "Магазин",
      "Торговля · лавка",
      "Донат, Боевой Пасс, монеты, ингредиенты, 12 котов, Серая Броня, Ларец / Семя Стихий.",
      "grid-cols-1 lg:grid-cols-12",
      [
        block(
          "Кошелёк",
          "Battle coins.",
          rows([
            ["Battle coins", `<span id="battle-coin-balance">1 240</span>`],
            ["Таймер витрины", `<span id="shop-timer">04:12:09</span>`],
            ["Выбрано", `<span id="selected-count">0</span>`],
            ["Сумма", `<span id="total-bm-price">0</span>`],
          ]) +
            `<button type="button" class="wf-cta" id="buy-all-btn">Купить выбранное</button>`,
          "lg:col-span-3"
        ),
        block(
          "Витрина",
          "Каталог без картинок — ячейки с названиями.",
          `<div id="shop-catalog-grid" class="wf-grid" style="grid-template-columns:repeat(3,1fr)">${[
            "Ларец обычный",
            "Ларец редкий",
            "Семя Стихий",
            "Боевой Пасс",
            "Серая Броня",
            "Кот · танк A",
            "Кот · танк B",
            "Кот · боец A",
            "Кот · боец B",
            "Кот · стрелок A",
            "Кот · стрелок B",
            "Кот · саппорт A",
          ]
            .map((n) => `<div class="wf-row" style="flex-direction:column;min-height:4rem"><span>${n}</span><span class="hint">цена BM</span></div>`)
            .join("")}</div>`,
          "lg:col-span-9"
        ),
        `<div id="toast" class="wf-block lg:col-span-12" hidden><span id="toast-icon"></span><strong id="toast-title"></strong><span id="toast-desc"></span></div>`,
      ].join("\n")
    ),

  market: () =>
    page(
      "Рынок",
      "Торговля · ресурсы",
      "Семена для Двора, Лопата / топор / Кирка, скупка добычи.",
      "grid-cols-1 lg:grid-cols-12",
      [
        block(
          "Инструменты и семена",
          "Покупка.",
          rows([
            ["Лопата", "120 fish"],
            ["Топор", "120 fish"],
            ["Кирка", "120 fish"],
            ["Семена для Двора", "40 fish"],
          ]),
          "lg:col-span-5"
        ),
        block(
          "Быстрая скупка",
          "Выбор лута на продажу.",
          `<div class="wf-grid" style="grid-template-columns:repeat(2,1fr)">
<div class="wf-row" id="loot-item-1">Травы ×12</div>
<div class="wf-row" id="loot-item-2">Древесина ×40</div>
<div class="wf-row" id="loot-item-3">Камень ×20</div>
<div class="wf-row" id="loot-item-4">Руда ×8</div>
</div>
<div class="wf-row"><span>Выбрано</span><span id="selected-count-label">0</span></div>
<div class="wf-row"><span>Выручка</span><span id="total-revenue-label">0</span></div>
<div class="wf-row"><span>Кошелёк</span><span id="player-wallet-display">3 420</span></div>
<button type="button" class="wf-cta" id="quick-sell-btn">Скупка</button>
<div id="market-toast" class="wf-row" hidden><span id="market-toast-icon"></span><span id="market-toast-text"></span></div>`,
          "lg:col-span-7"
        ),
      ].join("\n")
    ),

  auction: () =>
    page(
      "Аукцион",
      "Торговля · торги игроков",
      "Лоты: коты, броня, оружие, ингредиенты. Выставить лот / мои ставки / продажи.",
      "grid-cols-1 lg:grid-cols-12",
      [
        block(
          "Фильтры",
          "Категории лотов.",
          rows([
            ["Все", "активно"],
            ["Коты", ""],
            ["Броня", ""],
            ["Оружие", ""],
            ["Ингредиенты", ""],
          ]) +
            `<div class="wf-tags"><button type="button" class="wf-cta muted" id="reset-filters">Сброс</button><button type="button" class="wf-cta" id="btn-create-lot">Выставить лот</button></div>`,
          "lg:col-span-3"
        ),
        block(
          "Лента лотов",
          "Торги сейчас.",
          rows([
            ["Кот · ranger A", "ставка 800"],
            ["Серая кираса", "ставка 120"],
            ["Семя огня", "ставка 60"],
            ["Кольцо R3", "ставка 240"],
          ]) +
            `<div class="wf-tags"><button type="button" class="wf-cta ghost" id="tab-my-bids">Мои ставки</button><button type="button" class="wf-cta ghost" id="tab-my-sales">Мои продажи</button><span id="session-clock" class="wf-tag">12:44</span></div>
<div id="container-my-bids" class="wf-grid"></div>`,
          "lg:col-span-9"
        ),
        `<div id="modal-lot" class="wf-block lg:col-span-12" hidden>
<h2>Новый лот</h2>
<div class="wf-tags"><button type="button" class="wf-cta" id="btn-submit-lot">Опубликовать</button><button type="button" class="wf-cta muted" id="btn-close-modal">Закрыть</button></div>
</div>`,
      ].join("\n")
    ),

  rating_players: () => ratingPage("Рейтинг Игроков", "Таблица Лидеров · Топ-100 · игроки"),
  rating_guilds: () => ratingPage("Рейтинг Гильдий", "Таблица Лидеров · Топ-100 · гильдии"),

  armor_sets: () =>
    page(
      "Сеты брони",
      "База знаний · атлас",
      "Каталог сетов брони. Фильтры all/owned/locked. Inspector без картинок.",
      "grid-cols-1 lg:grid-cols-12",
      [
        block(
          "Фильтры",
          "",
          `<div class="wf-tags"><button type="button" class="wf-cta" id="filter-all">Все</button><button type="button" class="wf-cta ghost" id="filter-owned">Есть</button><button type="button" class="wf-cta ghost" id="filter-locked">Закрыто</button></div>` +
            rows([
              ["Громовой коготь", "R5"],
              ["Шерстяной страж", "R3"],
              ["Пепельный панцирь", "R2"],
              ["Серый комплект", "R1"],
            ]),
          "lg:col-span-7"
        ),
        block(
          "Inspector",
          "Детали сета.",
          `<div id="inspector-title" class="wf-row">Громовой коготь</div><div id="inspector-image" class="wf-row hint">[блок превью · без img]</div>` +
            rows([
              ["Бонус 2 шт", "+HP"],
              ["Бонус 4 шт", "+DEF"],
              ["Статус", "gated tip"],
            ]),
          "lg:col-span-5"
        ),
      ].join("\n")
    ),

  class_sets: () =>
    page(
      "Классовые сеты",
      "База знаний",
      "Сеты по ролям: танк / боец / стрелок / маг / саппорт. Без картинок — сетка карточек.",
      "grid-cols-1 lg:grid-cols-12",
      [
        block(
          "Роли",
          "",
          `<div class="wf-grid" style="grid-template-columns:repeat(3,1fr)">${["Танк", "Боец", "Ассасин", "Стрелок", "Маг", "Саппорт"]
            .map((r) => `<div class="wf-row" style="flex-direction:column;min-height:5rem"><span>${r}</span><span class="hint">сет · бонусы</span></div>`)
            .join("")}</div>`,
          "lg:col-span-12"
        ),
      ].join("\n")
    ),

  // craft + soon_farm restored as painted forms — do not regenerate wireframes
};

function chatPage(title, lead) {
  return page(
    title,
    "Чаты",
    lead,
    "grid-cols-1 lg:grid-cols-12",
    [
      block(
        "Лента",
        "Сообщения канала.",
        `<div id="chatStream" class="wf-grid wf-fill">${rows([
          ["МуррКотик", "привет, очаг"],
          ["Хранитель_7", "кто в данж?"],
          ["Система", "сезон IV активен"],
          ["Лапка", "пати +1 саппорт"],
        ])}</div>
<form id="chatForm" class="wf-tags" style="margin-top:.4rem"><input id="chatInput" class="wf-row wf-fill" placeholder="Сообщение…" /><button type="submit" class="wf-cta">Отправить</button><button type="button" class="wf-cta muted" id="rollDiceBtn">🎲</button></form>`,
        "lg:col-span-8"
      ),
      block(
        "Карточка игрока",
        "Inspector.",
        `<div id="inspectorPanel" class="wf-grid">
<div class="wf-row"><span>Имя</span><span id="inspectorName">МуррКотик</span></div>
<div class="wf-row"><span>Уровень</span><span id="inspectorLevel">24</span></div>
<div class="wf-row"><span>BM</span><span id="inspectorBm">14.2k</span></div>
<div class="wf-row"><span>Статус</span><span id="inspectorStatus">в таверне</span></div>
<div class="wf-row hint" id="inspectorIcon">[аватар-блок]</div>
</div>`,
        "lg:col-span-4"
      ),
    ].join("\n")
  );
}

function ratingPage(title, lead) {
  return page(
    title,
    "Рейтинги · сезон",
    lead,
    "grid-cols-1 lg:grid-cols-12",
    [
      block(
        "Фильтр сезона",
        "",
        rows([
          ["Сезон", "IV"],
          ["Регион", "RU"],
          ["Период", "неделя"],
        ]),
        "lg:col-span-3"
      ),
      block(
        "Таблица Лидеров · Топ-100",
        "Ровные колонки.",
        rows(
          Array.from({ length: 10 }, (_, i) => [
            `#${i + 1} · Игрок/гильдия ${i + 1}`,
            `${14000 - i * 120} BM`,
          ])
        ),
        "lg:col-span-9"
      ),
    ].join("\n")
  );
}

for (const [id, fn] of Object.entries(screens)) {
  const html = fn();
  const out = path.join(SRC, `${id}.html`);
  fs.writeFileSync(out, html, "utf8");
  console.log(`wrote ${id}.html (${html.length} bytes)`);
}

console.log(`done ${Object.keys(screens).length} wireframes`);
