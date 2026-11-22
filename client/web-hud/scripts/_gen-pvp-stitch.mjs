/**
 * One-shot: write PvP load / fight / victory stitch-src from Stitch packs.
 * Run: node client/web-hud/scripts/_gen-pvp-stitch.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../design/stitch-src");

const LOAD_BG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAJxygwqf5B_E8qqrSetmdVkSI2tINAcqpJGnNlH6BsM1dgVLwCMIr_u7whzA5mWnsUCFEjJ9PgLFkiCtrF1-TUOfPdiKld9my8M6ooKWSZ-RgAXGIPRlNFuSd0hbEjCMtsJZVO4qclShC021GGc5swMtZZtRrSZJWqj5uxxhCVMUmN_0Bv-d35c7SG8MJ3ieRYa3MYTVGEiUMnH7mejxFGyoI7h-B7R-xoYFXipg";
const FIGHT_BG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA0OgVAbd-An46lDVS3gtqb8fY6CiigzzI53vq6dH8IBzeJ4-eKSt_tYUWhoRE3USdMZcKnHmcyI72wc3JfJ4mXDry9tV9G6rOGdwPBxrNrcY0K8CAJfmgY36iW9wJT5jrhnp5u3UzwencxjCxXmXfG4Pi7CyrPR3L0aKPYFhYXsWmRkwGKlxCVey4O5x1jzP6fZCWRXojHkPbVHrl0xMHtNRST_nZ7-xhslHohvw";
const VIC_BG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDKYQ8Z0KKbYst55umewpEMvp1JSk1D92-FDbDG6g1ZDpQH8AHU-KSOxA8-zzMp1eC-mt_T54iakZ0G3ehFUYqX5I2abmNcXNKnyrbBy8igs_fdYdu0Lc-7owJklhen3z5SV1Lf1A5xqRh4yYcsZVHX1n0hsUSKcZeGNIs_WPf_8czBUGGDVSDw1gX8lH8catMsRX984ukFPZ6VvxqL1WOJiKOWJ_ed1BfcRJSaMw";

const tw =
  'tailwind.config={darkMode:"class",theme:{extend:{colors:{primary:"#fdba45","primary-container":"#d99b26","on-primary":"#432c00",secondary:"#89d98c",surface:"#161310","on-surface":"#eae1db",outline:"#9d8f7b",background:"#161310",error:"#ffb4ab","error-container":"#93000a",tertiary:"#ffb4a6"}}}};';

const loadHtml = `<!DOCTYPE html>
<html class="dark" lang="ru">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Загрузка PvP 3v3 — Мифиус</title>
<script src="https://cdn.tailwindcss.com"></script>
<script id="tailwind-config">${tw}</script>
</head>
<body>
<!-- Live PvP ranked duel load. Address: /pvp-load. Soft exits closed; shared fillNav only. MF-148 full-body cats. -->
<main class="pvp-load mythfel-form-body" data-purpose="pvp-load" data-purpose-route="pvp-load">
<div class="pvp-load-stage">
<img class="pvp-load-art" alt="" src="${LOAD_BG}"/>
<div class="pvp-load-shade"></div>
<header class="pvp-load-head">
<p class="pvp-load-kicker">⚔ Загрузка PvP боя · Рейтинговая дуэль 3v3 ⚔</p>
<p class="pvp-load-sync-line"><span class="pvp-load-dot"></span> Синхронизация арены и подбор колод…</p>
</header>
<!-- MF-148: full-body heroes on arena (no card plates). -->
<div class="battle-load-roster" data-purpose="load-roster">
<div class="battle-load-side is-ally" id="pvpLoadAllyFigures"></div>
<div class="battle-load-vs-gap" aria-hidden="true"><span>VS</span></div>
<div class="battle-load-side is-enemy" id="pvpLoadEnemyFigures"></div>
</div>
<div class="pvp-load-vs">
<span class="pvp-load-vs-mark">VS</span>
<div>
<strong>Раунд 1 · Дуэль 3v3</strong>
<em>Награда: <b class="is-up">+28</b> / <b class="is-down">−18</b> pts</em>
</div>
<span class="pvp-load-arena-pct">Арена: <b id="pvpLoadArenaPct">0%</b></span>
</div>
</div>
<div class="pvp-load-teams pvp-load-teams--meta">
<section class="pvp-load-team is-ally" id="pvpLoadAlly">
<header>
<span class="pvp-load-badge">Вы</span>
<div>
<strong>«Мурр-Оплот»</strong>
<em>Союзный отряд</em>
</div>
<b>Мощь: 18 450</b>
</header>
<ul id="pvpLoadAllyList" class="pvp-load-names"></ul>
<footer>
<span>Синергия: Плазма &amp; Пар (+25% урона)</span>
<em>Хранитель: Миурицио</em>
</footer>
</section>
<section class="pvp-load-team is-enemy" id="pvpLoadEnemy">
<header>
<span class="pvp-load-badge">Враг</span>
<div>
<strong>«Свора Гладиаторов»</strong>
<em>Соперники</em>
</div>
<b>Мощь: 17 980</b>
</header>
<ul id="pvpLoadEnemyList" class="pvp-load-names"></ul>
<footer>
<em>Хранитель: Клык</em>
<span>Синергия: Кровавый Шторм (+15% крита)</span>
</footer>
</section>
</div>
<footer class="pvp-load-foot">
<span>Бои › PvP Колизей (Рейтинговая Дуэль 3v3)</span>
<span class="pvp-load-league">Золотая лига II</span>
<span class="pvp-load-ping">18 ms</span>
<div class="pvp-load-bar-wrap">
<span id="pvpLoadBarLabel">Синхронизация колод: 0%</span>
<div class="pvp-load-bar"><i id="pvpLoadBar" style="width:0%"></i></div>
</div>
<button type="button" class="pvp-load-go" id="pvpLoadGo">В бой</button>
<button type="button" class="pvp-load-back" id="pvpLoadBack">Назад</button>
</footer>
</main>
</body>
</html>
`;

const fightHtml = `<!DOCTYPE html>
<html class="dark" lang="ru">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>PvP бой 3v3 — Мифиус</title>
<script src="https://cdn.tailwindcss.com"></script>
<script id="tailwind-config">${tw}</script>
</head>
<body>
<!-- Immersive PvP 3v3 fight · Stitch pvp_3v3 · live units/hand via renderPvpFight -->
<main class="pv-fight mythfel-form-body" data-purpose="pvp-fight">
<img class="pv-bg" alt="" src="${FIGHT_BG}"/>
<div class="pv-shade" aria-hidden="true"></div>
<div class="pv-ui">
<header class="pv-top">
<div class="pv-top-left">
<span class="pv-live-dot" aria-hidden="true"></span>
<div class="pv-top-copy">
<p id="pvRound">Раунд 1 · Ход игрока</p>
<p id="pvEnergy">Энергия 0</p>
</div>
</div>
<div class="pv-clash" aria-hidden="true"><b>Ближний стык</b><span>Дистанция боя</span></div>
<button type="button" id="pvSurrender">Сдаться</button>
</header>
<div class="pv-field">
<section class="pv-side is-ally">
<h2>Отряд Мурр-Оплота</h2>
<ul class="pv-units" id="pvAllies"></ul>
</section>
<div class="pv-vs" aria-hidden="true"><span>VS</span></div>
<section class="pv-side is-enemy">
<h2>Свора гладиаторов</h2>
<ul class="pv-units pv-foes" id="pvEnemies"></ul>
</section>
</div>
<footer class="pv-foot">
<div class="pv-act">
<p id="pvOrbs">0 карт</p>
<button type="button" class="pv-keep" id="pvKeep" title="Удержать карту (§3.4)">Keep</button>
<button type="button" class="pv-end" id="pvEndTurn">Завершить ход</button>
</div>
<ul class="pv-hand" id="pvHand"></ul>
</footer>
</div>
</main>
</body>
</html>
`;

const victoryHtml = `<!DOCTYPE html>
<html class="dark" lang="ru">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Славная победа PvP — Мифиус</title>
<script src="https://cdn.tailwindcss.com"></script>
<script id="tailwind-config">${tw}</script>
</head>
<body>
<!-- PvP coliseum victory · Stitch victory tavern · CTAs via data-col -->
<main class="col-win mythfel-form-body" data-purpose="pvp-victory">
<img class="col-bg" alt="" src="${VIC_BG}"/>
<div class="col-shade"></div>
<div class="col-ui">
<header class="col-top">
<p class="col-kicker"><span>Сезонный рейтинговый матч · Золотая лига II</span><span id="colStreak">Серия: 1 победа</span></p>
<h1>Славная победа в Колизее!</h1>
<p id="colLead">Арена рукоплещет отряду Хранителя. Все три мифических кота выстояли.</p>
</header>
<ul class="col-cats">
<li>
<span class="col-chip is-fire">Огонь · ДПС</span>
<figure><img alt="" src="/stitch-assets/cat-heroes/fighter-a.webp"/></figure>
<div>
<b>Рыжик Вспышкохвост</b>
<small>Мастер Пламенный Клинок</small>
<div class="col-stats"><p><em>Нанес урон</em><strong>3 950</strong></p><p><em>Серия комбо</em><strong>x4 Комбо</strong></p></div>
</div>
</li>
<li class="is-mvp">
<span class="col-badge">MVP матча</span>
<span class="col-chip is-storm">Камень · Танк-лидер</span>
<figure><img alt="" src="/stitch-assets/cat-heroes/tank-a.webp"/></figure>
<div>
<b>Барсик Щит-утёс</b>
<small>Титанический Щит Колизея</small>
<div class="col-stats"><p><em>Урон за серию</em><strong>4 620</strong></p><p><em>Поглощено</em><strong>1 600 Щита</strong></p></div>
</div>
</li>
<li>
<span class="col-chip is-water">Вода · Хил</span>
<figure><img alt="" src="/stitch-assets/cat-heroes/support-a.webp"/></figure>
<div>
<b>Мурка Каплегривка</b>
<small>Оракул Приливов</small>
<div class="col-stats"><p><em>Исцеление</em><strong>1 480 HP</strong></p><p><em>Потерь</em><strong>0 Павших</strong></p></div>
</div>
</li>
</ul>
<footer class="col-foot">
<section class="col-panel">
<div class="col-panel-head"><span>Оценка мастерства</span><b>S-ранг</b></div>
<p>Синергия «Плазма и Пар» · бонус серийного урона на арене</p>
<p class="col-dps">Средний DPS отряда <strong>2 940 DPS</strong></p>
<div class="col-bar" aria-hidden="true"><i></i></div>
<small>Эффективность линии · 98%</small>
</section>
<section class="col-panel">
<div class="col-panel-head"><span>PvP награды в очки</span><b>+28 PTS</b><em>stub</em></div>
<ul class="col-loot">
<li><b>Жетон</b></li>
<li><b>+450 EXP</b></li>
<li><b>PvP Сундук</b></li>
<li><b>PvP Руны</b></li>
</ul>
<small>Числа наград — сервер / stub, не SoT клиента</small>
</section>
<section class="col-panel col-next">
<span>Следующие действия</span>
<button type="button" class="col-go" data-col="again">Следующий бой <small>пробел</small></button>
<div>
<button type="button" data-col="lobby">ESC · В лобби</button>
<button type="button" data-col="log">Лог боя</button>
</div>
<small>Энергия на следующий бой: stub</small>
</section>
</footer>
<p class="col-keys"><span>ESC Лобби</span><span>Пробел В бой</span><span>R Карты</span></p>
</div>
</main>
</body>
</html>
`;

fs.writeFileSync(path.join(SRC, "pvp_load.html"), loadHtml);
fs.writeFileSync(path.join(SRC, "pvp_fight.html"), fightHtml);
fs.writeFileSync(path.join(SRC, "pvp_victory.html"), victoryHtml);
console.log("wrote pvp_load / pvp_fight / pvp_victory →", SRC);
