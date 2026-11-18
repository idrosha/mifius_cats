# Журнал решений (ADR-lite)

Append-only. Новые записи — **сверху** (после шаблона). Id: `D-001`… монотонно.

## Правила журнала

1. **Пиши**, если: ломает альтернативу надолго, меняет UX/скоуп SL, спорили ≥2 варианта, или Andrew сказал «locked».
2. **Не пиши**: очевидный багфикс, локальный рефактор, чисто стилевой CSS без продукта.
3. Статусы: `Proposed` → `Accepted` / `Rejected` → `Superseded by D-xxx`.
4. `Accepted` по **механике** = обязателен патч `FULL-SPEC.md` (§) в той же задаче. Без патча — не Accepted.
5. `Accepted` по **продукту/процессу** (не бой) → достаточно этой записи + ссылка из `docs/DOCUMENTATION.md` / prefs при необходимости.
6. Одна запись = одно решение. Не смешивать баланс и IA в одном D-id.
7. В коде/доках ссылайся `D-0xx`, не копируй абзац Context.

## D-043 · 2026-11-18 · Poison: постоянный стек +1/тик; random_enemy

- **Status:** Accepted
- **Area:** battle | content
- **SSOT:** docs/FULL-SPEC.md §3.4 · §3.5 · §4.1
- **Owner:** Andrew / battle

### Context
Ch4 питбосс: убийцы травят случайных бойцов; яд не должен спадать по duration, только копиться и усиливаться. После смерти убийц некромант рвёт тыл, пока фронт под DoT.

### Decision
**Poison (LOCKED):** `duration` игнор → 0; тик наносит `stacks` урона, затем `stacks++`; снятие только cleanse/mint. **`targetRule: random_enemy`:** seeded pick среди живых (stealth filter); taunt не редиректит (spread DoT). Ch4 f3: 2 assassin `random_enemy`+poison; necro heal, пока живы убийцы, иначе `backline` охота (AI).

### Consequences
Shop assassin poison cards наследуют тот же стек. Wiki/HUD tip ch4 обновлены. Clear-all на стартерах остаётся CI-гейтом.

## D-042 · 2026-11-18 · Mythmir f3: тактические расстановки питбоссов

- **Status:** Accepted
- **Area:** battle | content
- **SSOT:** docs/FULL-SPEC.md §4.1
- **Owner:** Andrew / battle

### Context
Волна 3 всех глав была однотипной (танк·питбосс·саппорт). Нужен «режим шахмат»: разные угрозы и приоритеты целей на стартерах танк·DPS(backline)·хил; без тактики — поражение.

### Decision
Зафиксировать f3-расстановки (sim lane 0=фронт→2=тыл): **1** соло-босс центр + pierce (пустые фланги `empty_lane`); **2** босс фронт + 2 хила; **3** танк·босс·танк; **4** 2 poison-убийцы + некромант-тыл; **5** танк·рубящий босс·хил. AI support предпочитает heal по раненым; P1 AutoPlay смещает приоритет на `backline`, если жив вражеский support. Wiki + layout/clear tests обновлены.

### Consequences
HUD не рисует `empty_lane` (класс `.hidden` — Tailwind `flex` иначе оставляет «пёс отдыхает»). Clear на стартерах — CI-гейт с backline у DPS. Ch2 питбосс: прыжки `backline` в тыл (retune 2026-11-18).

## D-041 · 2026-11-18 · Fatality overlay: вид цели, не всегда «котик»

- **Status:** Accepted
- **Area:** hud
- **SSOT:** docs/FULL-SPEC.md §3.5
- **Owner:** Andrew / web-hud

### Context
`D-032` зафиксировал красный fatality «КОТИК ОТДЫХАЕТ» на любом мёртвом юните. На practice/PvE/данжах/рейдах это врёт: манекены и монстры тоже показывали «котик».

### Decision
Один хелпер `unitFatalityLabel`: **котик** (герои/PvP) → «котик отдыхает»; **practice dummy** (`bot_practice_*`) → «манекен отдыхает»; **бот-монстр** (PvE/данж/рейд, фракции `D-039`) → «{вид} отдыхает» — `пёс` (dogs/red_dogs), `волк`, `зомби`, `призрак`. CSS по-прежнему uppercases. Не трогать `#appNav` / SoT боя.

### Consequences
Мёртвый «Пёс-щитоносец» → «ПЁС ОТДЫХАЕТ»; манекен → «МАНЕКЕН ОТДЫХАЕТ». Wiki/codex синхронизированы. `D-032` остаётся про щит/статусы; текст смерти уточнён здесь.

## D-040 · 2026-11-17 · Sprite facing: герои вправо, враги влево

- **Status:** Accepted
- **Area:** hud
- **SSOT:** docs/FULL-SPEC.md §6 (презентация)
- **Owner:** Andrew / web-hud (MF-170)

### Context
Арт cutout/портретов смотрит в разные стороны. В бою союзники слева / враги справа должны смотреть к центру. На остальных формах котики всегда вправо, манекены и PvE-монстры — влево. Старый путь `.battle-load-figure.is-enemy img { scaleX(-1) }` зеркалил всех врагов на load (ломая PvP-котов и уже «левых» манекенов) и не покрывал live fight.

### Decision
Locked type-facing: **cat heroes → right**; **practice dummies + PvE monsters/soldiers/pitbosses → left** on every form. Implement via one helper (`applySpriteFacing` / `spriteFaceHtml`) + CSS `.mf-sprite-face.is-flipped` (`scaleX(-1)` on a wrapper so MF-149 idle breathe on `img` still works). Flip only when native art face ≠ desired (`ART_NATIVE_FACE_LEFT`). Cutouts without BG stay fight-only (`D-037`); framed portraits only flip facing. Do not change `#appNav` / `#appSubTabs` (`D-025`).

### Consequences
Practice/PvE boards look toward center. PvP enemy cats stay facing right (they are cats). New assets: add to `ART_NATIVE_FACE_LEFT` only if authored facing left.

## Шаблон (копировать)

```markdown
## D-0XX · YYYY-MM-DD · Краткий заголовок

- **Status:** Proposed | Accepted | Rejected | Superseded by D-0YY
- **Area:** battle | economy | hud | liveops | process | content
- **SSOT:** `docs/FULL-SPEC.md` §N | none
- **Owner:** @who

### Context
Что было неясно / какие варианты.

### Decision
Что выбрали (1–5 предложений).

### Consequences
Плюсы, минусы, follow-up задачи. Что *не* делаем.
```

---

## D-039 · 2026-11-17 · Мифмир: 5 глав × 3 волны, HP/смерть, усталость

- **Status:** Accepted
- **Area:** battle | content | liveops
- **SSOT:** `docs/FULL-SPEC.md` §4.1
- **Owner:** Andrew / battle+content (MF-163)

### Context
Нужна ясная кампания Мифмир: фракции врагов по главам, карты атак солдат/питбоссов, баланс без шмотков на стартерах, правила между волнами (HP / смерть) и post-fight усталость.

### Decision
1. **5 глав × 3 уровня:** солдаты → солдаты → питбосс+солдаты (`mythmir_{ch}_f{1..3}`).
2. **Фракции:** 1 обычные псы · 2 северные волки · 3 красные псы · 4 зомби · 5 призраки (таблица §4.1).
3. **Между уровнями одной главы:** живые → полный HP; мёртвые не воскресают (`CreatePvE.carryAlive`).
4. **Усталость** после win/lose: таверна или 5–10 мин; SL = stub (`pve_fatigue_stub`).
5. Баланс: каждый питбосс clearable стартерами tank+fighter+support без gear/potions.

### Consequences
Stage JSON + campaign/wiki синхронизированы с фракциями. Клиент не SoT урона/наград. Follow-up: жёсткий fatigue-gate и LiveOps числа без смены ядра.

## D-038 · 2026-11-17 · Attack-card text = live overlay (not baked art)

- **Status:** Rejected
- **Area:** hud | content | liveops
- **SSOT:** none (откат HUD overlay)
- **Owner:** Andrew / web-hud

### Context
Баланс D-035 ломал цифры на PNG/WebP пластинах. Пробовали live overlay поверх арта.

### Decision
**Rejected (Andrew):** оверлей выглядит плохо (мелкий текст / чужой пергамент). Текст эффекта снова **только на арте**. Playable SoT = content JSON; пластины с устаревшим текстом правит Andrew вручную — список: `docs/stitch-prompts-d035-tank-support-retune.md`.

### Consequences
HUD без overlay. Каталог `card-effects.json` / `gen-card-effects.py` можно оставить как helper для копипаста, не как live UI.

## D-037 · 2026-11-17 · Cat-hero без фона только в live-бою

- **Status:** Accepted
- **Area:** hud
- **SSOT:** docs/FULL-SPEC.md §6 (презентация); none (механика боя)
- **Owner:** Andrew / web-hud (MF-148)

### Context
Полноростовые портреты героев пришли с чёрным студийным фоном. Cutout (прозрачный PNG) нужен, чтобы котик стоял на арене в бою. Если тем же cutout кормить heroes / collection / home / lobby / load — ломается «карточка с фоном как была».

### Decision
**Без фона (RGBA cutout) — только в live-режиме боя:** `practice_fight`, `pvp_fight`, `battle` (и аналогичные fight HUD). Путь: `/stitch-assets/cat-heroes/battle/{slug}.png` через `catHeroBattleArt()`.  
**Все остальные формы** (heroes, collection, home/hero, practice lobby, load, victory, inspector…) — портреты **с фоном** из `/stitch-assets/cat-heroes/{slug}.png` через `catHeroArt()`. Не подменять дефолтный путь cutout’ом.

### Consequences
Два набора ассетов на героя. Новые экраны по умолчанию берут art **с фоном**, пока явно не fight HUD. Меню/orientGate не затрагиваются (`D-025`, `D-036`).

## D-036 · 2026-11-17 · Web HUD телефон = только landscape

- **Status:** Accepted
- **Area:** hud
- **SSOT:** docs/FULL-SPEC.md §6 (адаптив); none (механика боя)
- **Owner:** Andrew / web-hud (MF-145)

### Context
На soft-launch phone UI не должен быть portrait-first. Prefs уже фиксировали: телефон — горизонтально; портрет — rotate gate. Нужен locked id, чтобы агенты не плодили portrait media queries / второй «mobile shell».

### Decision
Web HUD на **телефоне** — только **landscape** (~16:9, цели ≈844×390 / 812×375). В phone portrait — **rotate gate**, не playable portrait UI. Это адаптация того же wide web-hud, **не** отдельный mobile/tablet shell (`D-012` остаётся: native/отдельные шеллы — после wide web). Меню/subtabs IA не менять (`D-025` / `D-033`). Реализация CSS/gate — **MF-145** (не дублировать в design-load задачах).

### Consequences
- Design-load / screen import: формы landscape; не писать portrait-first layout и не трогать `#appNav` / `#appSubTabs` chrome.
- QA smoke phone: landscape viewport; portrait → gate.
- Follow-up CSS только у MF-145 owner, пока задача открыта.

---


## D-035 · 2026-11-17 · Tank/Support late-finish card retune

- **Status:** Accepted
- **Area:** liveops | content | battle
- **SSOT:** docs/FULL-SPEC.md §2.1; `content/cards/shop_tank_stone_*`, `shop_support_water_*`
- **Owner:** Andrew / content+liveops

### Context
Когда в конце боя остаются танк+хил, щит/heal ≫ poke (Tank A почти без ATK, Support A без атаки) → stall до Mouse Hour.

### Decision
Пакет **Recommended** (числа в content JSON; арт не регенерить — playable SoT = JSON + wiki text / HUD AP meta):
- Tank A: shields −1…−2; `back` = guard bash atk4+shield5; `tail` atk6 + fragile 1
- Tank B: pierce eyes 5 / back 7; headwear shield 5; `tail` backline **cost 1**
- Support A: heal eyes 5 / muzzle 4 / back 2; `tail` = smite atk4 + heal 2 self (1 attack face)
- Support B: muzzle heal 3; back heal 2; ears atk 3; `tail` atk 5 · `lowest_hp` · weak 1

Роли читаются как раньше (A = wall/heal, B = pierce/buff); finish без превращения в DPS.

### Consequences
+ Late tank+heal закрывается картами. − Цифры на старых PNG/WebP артов могут расходиться с SoT до регена арта. Practice stage `practice_dummy_1` синхронизирован.


## D-034 · 2026-11-17 · Practice lobby: танк всегда справа

- **Status:** Accepted
- **Area:** hud
- **SSOT:** `docs/FULL-SPEC.md` §4.2 (+ §2.1 sim lanes)
- **Owner:** @andrew

### Context
На «Тренировка» снова рисовали строй L→R как фронт→тыл (танк слева). Визуально танк оказывался сзади относительно VS/манекенов. Уже чинили в #143 (`PRACTICE_VISUAL_LANES = [2,1,0]`), потом откатили в dojo UX («front→back lanes»).

### Decision
Locked: lobby + victory paint L→R = **тыл · центр · авангард** (танк справа). `practiceSquad` / CreatePvE остаются sim `lane 0..2` = фронт→тыл. Константа `PRACTICE_VISUAL_LANES = [2,1,0]` — единый remap; не приравнивать visual index к sim lane без Andrew + новый `D-0xx`.

### Consequences
+ Совпадает со stitch empty/fight и кодексом додзё. − Нельзя «упрощать» отрисовку до `[0,1,2]`. Регресс = баг, не новый дизайн.

## D-033 · 2026-11-15 · Locked IA меню (порядок primary/subtabs)

- **Status:** Accepted
- **Area:** hud
- **SSOT:** docs/FULL-SPEC.md §6; docs/nav-ia.md
- **Owner:** Andrew / web-hud

### Context
Нужен финальный порядок основного меню soft-launch. Предыдущая IA (`D-029`) держала МИФМИР top-level и сваливала чаты/рейтинги/кодекс в Гильдию.

### Decision
Locked primary (порядок): Боевой пропуск → Дом Хранителя → Торговля → Бои → Гильдии → Рейтинги → Друзья → База знаний. Subtabs — как в `docs/nav-ia.md` / `NAV` в `app.js`. Мифмир уходит под Бои (`battle_hub` + `pve`/`practice`/…). Chrome один (`D-029`) остаётся. **Дальше меню не менять** без Andrew + новый `D-0xx` + патч nav-ia + §6.

### Consequences
+ Стабильный IA для SL. − Новые primary (Рейтинги/Друзья/База) = существующие views/stubs. Supersedes IA-часть `D-029` (не chrome).

---

## D-032 · 2026-11-15 · Боевой HUD: щит / статусы / fatality

- **Status:** Accepted
- **Area:** battle | hud
- **SSOT:** docs/FULL-SPEC.md §3.5, §6 (`Battle`)
- **Owner:** web-hud + battle

### Context
В бою на карточках был только HP (+ щит текстом). Нужны: шкала щита при танк-баффе, иконки баффов/дебаффов с ходами, вспышка снятых дебаффов при cleanse, серые карты при stun/sleep, fatality «КОТИК ОТДЫХАЕТ». В PvP враг не должен видеть, кого бафнули щитом.

### Decision
Клиент рисует серверные `statuses` / `shield` / `events` (не считает бой). Щит = отдельная шкала; **PvP:** шкала щита только у союзников. Дебаффы/баффы/cleanse-clear / смерть — видны всем. `statediff`: `playable=false` при stun/sleep; cleanse/mint эмитят `statusOp:clear`.

### Consequences
+ Читаемый бой без клиентского SoT. − Fog щита пока только HUD (не redaction в payload) — follow-up: redact `shield` врага в statediff по viewer side.

---

## Индекс известных (до заведения журнала)

| Id | Тема | Где канон |
|---|---|---|
| D-001 | Единый цикл колоды draw/discard во всех режимах | FULL-SPEC §3 |
| D-024 | HP grid / gear color sets retune | `liveops/CHANGELOG.md`, wiki |
| D-026 | eyes/ears → active cards, N=6 | FULL-SPEC §2.3, `stitch-prompts-eyes-ears-active.md` |

*(Полные ADR для D-001…D-026 не восстанавливать задним числом — только индекс. Новые = полные записи ниже.)*

---

## D-031 · 2026-11-15 · Коллекция на SL = HUD stub + roster из профиля

- **Status:** Accepted
- **Area:** hud
- **SSOT:** docs/FULL-SPEC.md §6 (`collection`); §1 cap 15 / presets×5
- **Owner:** web-hud

### Context
Экран `collection` был пустой Stitch-оболочкой («Пусто»×12), с фейк БМ/рангом прайда/резонансом % вне FULL-SPEC; bind искал несуществующие `.roster-list`. Риск принять клиентский power за SoT.

### Decision
На SL коллекция = **HUD stub**: ростер из `profile.cats` (как home — shop×12, D-027; farm вне боевого грида); **3 редактируемых отряда** 3v3 local (+ persist; cap presets[5] в модели); фильтры роль/поиск. Без client SoT урона/наград. БМ / «резонанс %» / «Ранг V прайда» — не показывать как live. Серверный SavePreset — later. Каталог: `collection-stub.json` + `GET /api/dev/collection`.

### Consequences
+ Можно собрать 3 связки для smoke. − Пресеты не SoT боя до backend. Follow-up: SavePreset RPC; UI пресетов 4–5.

---

## D-030 · 2026-11-15 · Скрещивание на SL = HUD stub

- **Status:** Accepted
- **Area:** hud
- **SSOT:** docs/FULL-SPEC.md §4.4.1, §6 (`breeding`)
- **Owner:** web-hud

### Context
Экран `breeding` (Stitch altar) выглядел как live nursery: фейковый шанс %, мифик-родители, инкубатор/claim, мёртвый wiring (`data-action` ≠ bind). Риск принять клиентский roll/награду за SoT вопреки §4.4.1 (Phase 6 server).

### Decision
На SL скрещивание = **HUD stub**: форма алтаря + tip core fantasy; выбор родителей из локального roster; mats/incubator = Soon; CTA → gate tip («Подними ранг» / «Скоро»). **Нет** client SoT шанса/колоды/котёнка. Live breed / RPC / LiveOps `nursery_mythic_chance` — Phase 6. Каталог stub: `breeding-stub.json` + `GET /api/dev/breeding` (не экономика).

### Consequences
+ Можно доводить UX питомника без backend. − Числа на экране не SoT. Copy везде **N=6** (§4.4.1). Follow-up: `nursery_gameplay` + Breed RPC.

---

## D-029 · 2026-11-15 · Один chrome `#appNav` + IA = NAV

- **Status:** Accepted (chrome); IA primary **Superseded by D-033**
- **Area:** hud
- **SSOT:** docs/FULL-SPEC.md §6 (Hub chrome); docs/nav-ia.md
- **Owner:** web-hud

### Context
На hub Stitch-header дублировал меню, прятал `#appNav`, показывал фейковый wallet/VIP. FULL-SPEC §6 primary расходился с каноном `NAV` / `nav-ia.md`. Дефолт «Дом Хранителя» вёл в Soon-farm.

### Decision
Один chrome: `#appNav` / `#appSubTabs` на всех soft-launch экранах включая hub. (Порядок primary — см. **D-033**.) Дефолт Дома = `home`. Wallet в шапке из profile/wallet stub (не SoT). Dev LiveOps/Battle pills — не player chrome.

### Consequences
+ Нет второго меню на hub. − Хаб-бар Stitch не эталон навигации. IA-структура → `D-033`.

---

## D-028 · 2026-11-15 · Склад на SL = HUD stub

- **Status:** Accepted
- **Area:** hud
- **SSOT:** docs/FULL-SPEC.md §6 (экран Склад `gear`); note §7.1 HUD slots ≠ pendant/bow
- **Owner:** web-hud

### Context
Нужен рабочий экран Склад (`gear` / barn) для ручного smoke без Unity. Серверный inventory / Nakama ещё не задача soft launch. Риск: принять local `gearCatalog`/`barn*` за экономику или выдать стартовый экип вопреки §5.1.

### Decision
На SL склад = **HUD stub**: фильтры, вместимость UI, inspect, надеть/снять на кота через общие `equipItem`/`unequipSlot`. Каталог локальный. Серверный inventory — отдельная backend-задача. Стартовый pendant/bow не выдаём (§5.1). «Склад алхимика» / farm mats loop — не этот экран (Phase 6).

**Model note:** HUD stub slots (`helm`/`armor`/`cloak`/…) — презентация smoke; SSOT экипа боя = `pendantId` + `bowByPart` (§7.1). Клиентский экип **не** SoT урона/наград.

### Consequences
+ Можно доводить UX склада без бэкенда. − Числа cap/статов не SoT. Rules: `.cursor/rules/web-hud-gear.mdc`, `docs/nav-ia.md`. Backend inventory = follow-up (не SL).

---

## D-027 · 2026-11-15 · Home roster = 12 shop + фильтр по 6 ролям

- **Status:** Accepted
- **Area:** hud
- **SSOT:** none (презентация; каталог 6×2 = wiki / content)
- **Owner:** web-hud

### Context
Тестовый грант давал 3 starter + 12 shop → в «ВЫБОР ПЕРСОНАЖА» 15 строк и дубли артов. Вкладки «Танк / ДПС / Саппорт» не покрывали 6 классов.

### Decision
Ростер дома показывает только `shop_*` (12). Фильтры: Все, Танк, Бойцы, Убийцы, Стрелки, Маги, Саппорт. Стартеры остаются в профиле для боя как twins.

### Consequences
Счётчик «Герои: 12» совпадает с Базой знаний. Коллекция/grant по-прежнему может показывать 3+12+farm — отдельное решение, если урезать грант.
