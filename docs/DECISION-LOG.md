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

## D-066 · 2026-11-27 · MVP Beta scope (срез 1) vs Full post-beta

- **Status:** Accepted
- **Area:** process | economy | liveops
- **SSOT:** docs/FULL-SPEC.md §1.1, §5 (MVP limits), §14
- **Owner:** Andrew · design
- **Branch:** `cursor/mvp-beta-dad5`

### Context
Нужен узкий бета-срез для Telegram + Web + APK/iOS, уже текущего soft-launch §1 (таверна/рынок/аукцион/гача-банки/ads/«Скоро»). Полный контент репо остаётся на этап 2 после беты. Q&A Andrew 2026-11-27.

### Decision
**Этап 1 — MVP Beta MUST**
- Режимы: tutorial; practice 3v3; PvE 3v3 ≈**30** узлов; PvP ranked 3v3; PvP **unranked** 3v3; friendly duel (инвайт/ссылка).
- Мета: команды/пресеты; коллекция; прокачка **котов R1–R8** (account-level XP track — нет); рейтинги + **сезоны ~28д** + призы (titles/frames/cats/fish/yarn); реплеи ≤**10**; чат; настройки; минимальный кодекс; **Новости** in-game + закреп TG-канала про Full update.
- Магазин: прямая продажа котиков + боевой пасс. **Гача-банки (`gacha_jar`) в MVP нет.**
- Пасс (пакет **C** + финал): free track + premium; лимиты **free 3 PvE / 5 PvP**, **pass 4 PvE / 10 PvP** (не ×2→6 из §5 SL); ×2 cat rank XP на ACTIVE; cosmetics на треке; **завершение пасса → 1 случайный кот (server RNG)**. Ads — **нет**.
- Daily quests — **да** (отдельно от мисок/билетов).
- Зелья в бою — да (≤1/type). Стартовый грант §5.1 — да.
- Валюты: soft **Мифиус / MIFOUS** (= `fish` brand, wiki §10); premium `yarn` IAP. Тикер **`$MIFOUS`** зарезервирован как имя мем-коина; **on-chain в MVP не шипится**; NFT нет; сила боя / MMR за коин не покупается (анти-P2W). Модель интеграции ончейна — отдельный D-0xx позже.
- Платформы: Telegram (bot/Mini App) · Web · Android · iOS; **кросс-плей один MM-пул**. Auth: device/TG + **email link**.
- RU+EN.

**Этап 2 — Full (только News/backlog в этой ветке)**
Ферма, питомник, гильдии/клан-босс, данжи/рейды, таверна/рынок/аукцион, shop-гача/pity, Steam/PC, расширенный кодекс и пр. уже сделанное + доработки.

**Не делать в MVP билде:** включать post-beta системы «заодно»; client SoT боя; крипту/NFT в матчмейкинге.

### Consequences
- Агенты режут фичи по §1.1 + этот D-id; soft-launch §1 остаётся целью Full/SL, не путать с MVP Beta.
- Пасс-лимиты 4/10 и финальный random cat — LiveOps/`feature_flags.mvp_beta`; SL-числа §5 (6/10, jars, ads) не подставлять в MVP без нового D-0xx.
- Nav IA MVP-срез и экран News — отдельные задачи web-hud после этого lock.
- Сезонные призы (Top1 / 2–10 / 11–100 / 101–1000 / participation) — LiveOps season table; без покупки победы.

## D-065 · 2026-11-26 · Web HUD телефон: портретный режим, rotate gate снят

- **Status:** Accepted
- **Area:** hud
- **SSOT:** docs/FULL-SPEC.md §6 (адаптив)
- **Owner:** Ирина (product) · web-hud
- **Supersedes:** D-036

### Context
Телефон в портрете показывал только rotate gate, а при альбомном просмотре 16:9-стейдж (`#app`) делал формы мелкими. Продуктовый запрос: играть с телефона в портрете, формы те же, размеры под экран меньше.

### Decision
- Rotate gate (`#orientGate`) **не показывается**. `syncOrientGate()` в `public/app.js` только ставит `aria-hidden`.
- Портрет телефона (`max-width: 767px`, `orientation: portrait`) — отдельный блок **PHONE PORTRAIT** в конце `public/styles.css`: `#app` заполняет высоту, компактная шапка (brand + chrome, tabs с горизонтальным скроллом), меньшие шрифты и отступы, multi-col сетки → 2 колонки, `grid-cols-12` → стек, бой: стороны стекаются (враги сверху, союзники снизу).
- Состав, IA и логика экранов не меняются. Альбом и десктоп не затрагиваются.

### Consequences
- Новые portrait-правила допустимы **только** внутри блока PHONE PORTRAIT (≤767px); планшетный блок `≤768px portrait` остаётся как был.
- Отдельного mobile-shell нет (D-012 в силе): это тот же web-hud, адаптированный под портрет.
- QA: Device mode 390×844 / 360×740 / 430×932 + 844×390 (альбом) + 1280×800 (десктоп без изменений).

## D-064 · 2026-11-26 · Походы: «Готов» → пустая расстановка 4×3 → боты добирают

- **Status:** Accepted
- **Area:** hud
- **SSOT:** none (HUD UX; механика боя без изменений)
- **Owner:** Andrew / web-hud
- **Patches:** D-063 (данж 3v3-центр superseded: данж = тот же 12-cell 4×3)

### Context
После Ready 4/4 центр открывал расстановку уже заполненной. Данж по D-063 показывал отдельный 3v3-ростер; рейд — 12. Продукт: **одинаково** — пати 4 игрока × 3 котика, каждый ставит своих трёх.

### Decision
1. Кнопка пати: **«Готов»** (статус — «готов»).
2. После «Готов» 4/4 и **данж**, и **рейд** открывают одну доску **12 пустых** ячеек (4×3).
3. Ставить только героев из команды справа (`dungeonDeployPoolIds`); у игрока лимит 3 слота.
4. С ботами / соло-stub: игрок ставит первым; «Готово» — боты добирают пустые → бой.
5. В бою каждый управляет своими 3 котиками (крыло справа); боты — своими (общие правила хода). Боевое ядро данжа пока stub 3v3 на крыле игрока.

### Consequences
+ Паритет данж/рейд по расстановке. − Legacy `[data-dungeon-form-panel]` после Ready скрыт.

---

## D-063 · 2026-11-26 · Данж: расстановка после Ready + портреты в строе

- **Status:** Accepted
- **Area:** hud
- **SSOT:** none (HUD UX; механика боя без изменений)
- **Owner:** Andrew / web-hud

### Context
Рейд после Ready 4/4 меняет центр на «Состав легиона». Данж оставлял только дропдаун «Выбор команды». Слоты легиона резали арт до полоски `h-9` — аватарки почти не видны. Карточки рейда не показывали роль/элемент/HP как данж.

### Decision
1. Данж после Ready 4/4 — центр «Расстановка 3v3» (ростер как practice «Доступные Герои»); «Готово» гейтит «В путь».
2. Карточки строя (данж + легион) — **bust** (грудь/голова): `h-36` + `object-position: center 12%`, не full-body / не полоска `h-9`.
3. Рейд-слоты — тот же chrome, что данж: роль · элемент · имя · HP (`formationDisplayForTemplate` / `formationBustCardHtml`).
4. Порядок строк легиона сверху вниз: саппорты → стрелки/маги → убийцы/бойцы → танки. Правый данж-стрип остаётся 3-col (Тыл·Центр·Авангард), без отдельной полоски выбранных в центре.

### Consequences
+ Паритет данж/рейд по Ready→строй и по данным карточки. + Аватарки как practice. − Старт данжа без «Готово» в центре закрыт.

---

## D-062 · 2026-11-26 · Бои: одна вкладка «Походы» (данж+рейд)

- **Status:** Accepted
- **Area:** hud
- **SSOT:** docs/nav-ia.md; docs/FULL-SPEC.md §6
- **Owner:** Andrew / web-hud
- **Patches:** D-033 (combat subtabs: drop `boss_raid`)

### Context
Лобби данж/рейд уже общее (`viewBossDungeon`). Две subtab «Данж» и «Рейд» дублировали вход. Нужно одно имя и без отдельной страницы рейда.

### Decision
1. Subtab label: **«Походы»** (EN *Expeditions*) — одно слово поверх данж+рейд. Альтернатива «Данжи/Рейды» отвергнута как длинная для chrome.
2. Из `NAV` combat убрать `boss_raid`. Route `boss_dungeon` = канон; `boss_raid` и soft-path «рейд» = alias → тот же лобби с фильтром Рейд.
3. Вход с вкладки «Походы» открывает фильтр **Все**. Фильтры Данж/Рейд внутри лобби остаются.

### Consequences
+ Один пункт меню. − Legacy `#viewBossRaid` HTML может остаться скрытым (load chrome adopt). Рейтинги Данжи/Рейд не трогаем.

---

## D-060 · 2026-11-25 · Mythmir/dungeon clear-band + golden refresh

- **Status:** Accepted
- **Area:** liveops | battle
- **SSOT:** docs/FULL-SPEC.md §4.1; liveops/CHANGELOG.md
- **Owner:** Andrew / liveops+battle

### Context
Soft-launch CI: golden turn/frames drift; ch1 solo boss HP 95 (<100 layout); `mythmir_3_f2` / `dungeon_scarlet_short_2` and ch5 ghost soldiers unbeatable on starter AutoPlay (D-042 clear-all).

### Decision
1. Refresh golden `starters_vs_test_yard_1` → turn 6 / 36 frames.
2. Baron HP 95→110; nerf ch3 assassin-tank wave + scarlet short_2 copy; nerf ch5 f1/f2 ghost sustain so tank·DPS·support AutoPlay clears.

### Consequences
+ Clear-all / golden green again. − Ghost/ch3 soldiers slightly easier for humans too.

## D-059 · 2026-11-25 · Shop: 18 героев × 6 карт (вместо 12×72)

- **Status:** Accepted
- **Area:** content | battle
- **SSOT:** docs/FULL-SPEC.md §2.1, §5 Shop
- **Owner:** Andrew / content

### Context
CI `TestShopCardCosts_MatchWikiSnapshot` ждал 72 карты (12 A/B героев). В content уже elven-18: 6 ролей × fire/water/wind = 108 карт; старые `shop_*_a/b` удалены.

### Decision
1. Shop SL SoT = **18** templates × **6** parts = **108** `card_shop_*`.
2. Smoke costs / N6 / catalog assertions переведены на новые id; support не обязан иметь backline-атаку.

### Consequences
+ Тест совпадает с живым контентом. − Player wiki ещё может описывать A/B — отдельный wiki-pass.

## D-061 · 2026-11-25 · Live PvP: один бой, очередь ходов, таймер 30с

- **Status:** Accepted
- **Area:** battle | hud
- **SSOT:** docs/FULL-SPEC.md §3.2, §3.6, §8.2
- **Owner:** Andrew / battle+web-hud

### Context
Два аккаунта через `/api/dev/pvp/mm` (D-057) матчились, но каждый клиент звал свой `CreatePvP` → разные battleId/HP/ходы. P2 по-прежнему добивал AI (`AdvancePvEBots`). Таймер хода был только на practice HUD.

### Decision
1. `CreatePvP` **идемпотентен по `matchId`**: оба seat’а получают один battle.
2. MM отдаёт `seat` (0|1) + одинаковые `team1`/`team2` (первый в очереди = P1).
3. `humanP2:true` → AI на P2 **не** крутится; ходы строго P1↔P2 (§3.2).
4. `GetBattle` + poll + `seat` в `SubmitAction`; hand только своему seat.
5. Серверный deadline **30с** на ход (`turnDeadlineUnix` / `turnLeftSec`); просрочка = auto `endTurn`. HUD `#pvTimer`.

### Consequences
+ Синхрон двух экранов на soft-launch QA. − Dev MM всё ещё in-memory (не Nakama). Bot-stub PvP без изменений (AI P2).

## D-058 · 2026-11-25 (уточнено 2026-11-26) · Unspent energy на endTurn не даёт milk drops

- **Status:** Accepted
- **Area:** battle
- **SSOT:** docs/FULL-SPEC.md §3.3–3.4
- **Owner:** Andrew / battle

### Context
Изначально `endTurn` писал `MilkDrops += Energy`. Первый фикс снизил это до `+1` капли на каждый `endTurn` с остатком энергии, но пустые ходы без атак всё равно за 6 раундов выбивали 2 Milk Burst → к раунду 8 получались `5/5 AP` и `9` карт в руке (по 3 на кота вместо 2, вылезают за лоток).

### Decision
Неиспользованная энергия на `endTurn` просто сгорает (`Energy = 0`) и **не** начисляет `MilkDrops` / `BonusE` / `BonusDraw` (§3.3: «Unused energy не переносится»). `MilkDrops` начисляется только через явный `Keep`. Сброс руки / discard / redraw без изменений (§3.3).

### Consequences
`battle/internal/sim/action.go`; FULL-SPEC §3.4; regression `TestMilk_UnspentEnergy_NoCarryOrRunaway`.

## D-057 · 2026-11-25 · Арена: тумблер заглушки бот-MM вместо «кросс-плей»

- **Status:** Accepted
- **Area:** hud
- **SSOT:** none (HUD stub tooling; кросс-плей §0 без изменений)
- **Owner:** Andrew / web-hud

### Context
Кнопка «Пул: кросс-плей» на арене была декоративной. Поиск всегда через клиентский stub `rollPvpOpponentTeam`. Нужен ручной тумблер, чтобы выключить заглушку и проверить реальный пул двумя аккаунтами.

### Decision
1. Заменить pill на `#arenaBotMmToggle` («Боты: вкл/выкл»), default **вкл** (`mythfel_sl_pvp_bot_mm`).
2. Вкл → прежний локальный stub. Выкл → `POST/GET /api/dev/pvp/mm` (in-memory очередь, не Nakama).
3. CTA поиска во время поиска = «Отмена».

### Consequences
+ Можно гонять bot-MM и player-MM с одной кнопки. − Dev-очередь живёт только в процессе HUD-сервера.

## D-056 · 2026-11-25 · Коллекция: сначала команда, потом ростер (как practice)

- **Status:** Accepted
- **Area:** hud
- **SSOT:** none (HUD UX; механика отрядов — D-054)
- **Owner:** Andrew / web-hud

### Context
На Коллекции сборка шла «котик слева → слот справа». Это расходилось с Тренировкой (тап ростера кладёт в отряд) и путало при 4 командах на доске.

### Decision
1. Сначала выбирается **активная команда** справа (`colPresetIndex`: клик по карточке / слоту / «Команда N:»).
2. Тап котика слева **добавляет** в первый пустой слот активной команды (тыл→центр→авангард) или **снимает**, если он уже в этой команде.
3. Тап заполненного слота справа — очистка слота. DnD на слот сохраняется. Составы по-прежнему независимы (D-054).

### Consequences
+ Один порядок с practice. − Нет «выбрал котика → ткнул конкретный слот» без DnD; замена = убрать, потом добавить. Autopick пустых пресетов — только на первый seed сессии, не при очистке отряда.

## D-055 · 2026-11-25 · Коллекция: доска 4 отрядов 2×2 без скролла

- **Status:** Accepted
- **Area:** hud
- **SSOT:** none (HUD layout; механика отрядов — D-054)
- **Owner:** Andrew / web-hud

### Context
Вертикальный список 4 карточек на Коллекции требовал скролл; шапка карточки дублировала бейдж режима и поле имени.

### Decision
1. Правый блок `#colTeams` — единая сетка **2×2** (PvE·PvP / Данж·Рейд), без `overflow` скролла списка.
2. Шапка ячейки в одну строку: фиксированная метка `Команда N:` + editable `input` названия + `n/3`.
3. Слоты с заполненным котом — аватар-кроп (`object-fit: cover`, `object-position: top`), не full-body contain.

### Consequences
+ Все 4 отряда видны сразу. − На узкой высоте слоты компактнее (аватарки). Follow-up: mobile/landscape denseness check.

## D-054 · 2026-11-25 · Коллекция: 4 именованных отряда (PvE · PvP · Данж · Рейд)

- **Status:** Accepted
- **Area:** hud
- **SSOT:** docs/FULL-SPEC.md §6 (`collection`)
- **Owner:** Andrew / web-hud
- **Supersedes:** D-031 (только число/имена редактируемых отрядов)

### Context
На SL в Коллекции были 2 живых пресета (PvE + PvP), хотя D-031 / §6 говорили «3 отряда». Нужны отдельные связки под режимы: PvE, PvP, данж, рейд — без запуска live данж/рейд-боя и без превышения `presets[5]`.

### Decision
1. Редактируемых отрядов на SL = **4**: имена по умолчанию `PvE` · `PvP` · `Данж` · `Рейд` (`COL_SQUADS` / `COL_SQUAD_NAMES`).
2. Cap модели `presets[5]` без изменений; 5-й слот остаётся резервом / later.
3. Составы независимы (один котик может стоять в нескольких командах). Persist — local stub (`mythfel_sl_collection`), не SoT боя.
4. Не реализовывать live данж/рейд/clan-boss из этого экрана (soft-launch scope).

### Consequences
+ UI Коллекции / yard picker / PvP arena list показывают 4 пресета. − Backend SavePreset по-прежнему later. Follow-up: привязка режима боя к индексу пресета на сервере.

## D-053 · 2026-11-24 · Hand select → commit turn (all live modes)

- **Status:** Accepted
- **Area:** hud | battle
- **SSOT:** docs/FULL-SPEC.md §6 Battle HUD
- **Owner:** Andrew / web-hud

### Context
Карты в soft-launch fight HUD игрались сразу по тапу; эталон tray («ЗАВЕРШИТЬ ХОД» + glow) подразумевает набор выбранных карт и один commit. Нужен один UX во всех live-режимах (practice / Mythmir PvE / PvP / wire).

### Decision
1. Тап / hotkey 1–6 **выбирает** карту (toggle + amber glow); карта остаётся в руке.
2. AP HUD показывает остаток после резерва выбранных; нельзя выбрать сверх текущего energy.
3. **ЗАВЕРШИТЬ ХОД** / Space×2 / timeout: по очереди `playCard` (сервер SoT + FX), затем `endTurn` → ход врага (таймер / opp throw) как раньше.
4. Авто-бой по-прежнему играет карты сразу (без очереди выбора).
5. Targeting: по-прежнему `targetId:""` → server TargetRule (`D-050` / §6 pause на ручной aim).

### Consequences
`client/web-hud` `handSelection` + `commitHandSelectionAndEndTurn`; FULL-SPEC §6. Симулятор без batch API — клиент шлёт последовательные SubmitAction.

## D-052 · 2026-11-24 · Fight tray unify · no Keep button · potions ≤1 loadout

- **Status:** Accepted
- **Area:** hud | battle
- **SSOT:** docs/FULL-SPEC.md §3.4 Potions, §6 Battle HUD
- **Owner:** Andrew / web-hud

### Context
Live fight footer (PvP / practice / PvE) был неровным: правый act выше карт, у webp-плашек пустой «подвал» из-за stretch `height:100%`, Keep в tray путал, а HUD брал в бой весь склад зелий (2/1/2) вопреки §3.4 ≤1/potionId.

### Decision
1. Единый блок рука + правый act (AP · ЗАВЕРШИТЬ ХОД · авто · 3 баночки) во всех soft-launch live-режимах; act **закреплён у правого края** footer/console (`margin-left: auto`), рука заполняет остаток — без прыжка при смене числа карт.
2. Карты руки: размер от `--mf-hand-h` × 2:3, без stretch-подвала; `object-fit: cover` top.
3. Кнопка **Keep** снята с SL HUD (PvP / practice / wire). Механика Keep в симе §3.4 **не** удаляется.
4. Loadout зелий в бой: `min(1, warehouse)` на каждый potionId (хил / энергия / очищение); склад может хранить больше.

### Consequences
`client/web-hud` tray HTML/CSS/JS; FULL-SPEC §3.4 / §6. Симулятор `potionSet` уже капил ≤1/id.

## D-051 · 2026-11-21 · Mythmir wave layouts + shared bot energy budget

- **Status:** Accepted
- **Area:** battle | content | hud
- **SSOT:** docs/FULL-SPEC.md §4.1
- **Owner:** Andrew / battle
- **Supersedes:** f3 layout table of `D-042` (energy/AI notes for heal-starve still apply)

### Context
Нужны новые раскладки волн 1–5, общий пул энергии ботов (солдаты cost1; масс-атака босса cost2 = один удар; leftover солдатам по нужде), таунт→stun от питбосса, thorns-poison у зомби, dodge ~1/4 у призраков, UI «Волна 1·2·3».

### Decision
**Layouts (lane 0=front→2):** ch1 f1 три бойца; f2 танк+2 лучника; f3 соло-босс **фронт**. ch2 f1 боец·хил·лучник; f2 три лучника (`center`+taunt); f3 хил·босс·хил. ch3 f1 боец·танк·боец; f2 убийца·танк·убийца; f3 танк·босс·танк + масс bleed cost2. ch4 солдаты HP≈support; f1/f2 боец·убийца·боец (два вида бойца); f3 убийца·некро·убийца + масс poison cost2; hit vs zombie → +1 poison attacker. ch5 dodge 25% ghosts; f1 танк·боец·хил; f2 боец·хил·боец; f3 танк·босс·хил. **Energy:** shared side pool; mass boss card cost 2 = one hit; cannot double-cast 2E at 3E. Pitboss hit on taunter → `stun` 1 (cleanse removes). HUD: persistent wave 1·2·3 strip on live Mythmir fight.

### Consequences
`content/stages/mythmir_*`, `sim/ai.go` / `effects.go` / `targeting.go` (`center`), web-hud wave strip, campaign tests. `D-042` clear-on-starters CI remains.

## D-048 · 2026-11-20 · Live cutout silhouette by role

- **Status:** Accepted
- **Area:** hud
- **SSOT:** docs/FULL-SPEC.md §6
- **Owner:** Andrew / web-hud

### Context
На live-борде cutout’ы читались разного «роста»: assassin выше fighter/tank, вражеские манекены выше союзников из‑за разных art-well (`h-40` vs `aspect-[2/3]` ~16rem) и разного fill артов при `object-fit: contain`.

### Decision
**Locked (live cutouts only):** визуальный силуэт по `data-role` — assassin/mage < ranger < support < fighter < tank; все роли крупнее прежнего baseline. Размер через art-well `--mf-role-h` / `--mf-role-w` (не `transform` на спрайте — высокий арт ассасина не должен перегонять танк по голове). **Монстры (солдаты/боссы) и манекены** — та же шкала и те же wells, что у котиков-героев по роли. Lobby/портреты с фоном — без шкалы.

### Consequences
`styles.css` role wells on `#pfAllies` + `#pfEnemies` / PvP / yard; rule `.cursor/rules/fight-silhouette.mdc`; skill `web-hud.md`.

## D-047 · 2026-11-20 · Live board facing: left→right, right→left

- **Status:** Accepted
- **Area:** hud
- **SSOT:** docs/FULL-SPEC.md §6
- **Owner:** Andrew / web-hud
- **Supersedes:** board half of `D-040` (type-only «cats always right» on the enemy column)

### Context
Часть cutout’ов смотрела от центра: неверный `*_NATIVE_FACE_LEFT` (Мурка/Тень зеркалились зря; ch1 `fighter-h` не зеркалился) и PvP-коты справа оставались «вправо» по `D-040`.

### Decision
**Locked (live board / load roster):** колонка слева → face **right**; колонка справа → face **left** (к центру). Тип юнита не важнее стороны. Flip только если native ≠ desired (`CAT_`/`DUMMY_`/`MONSTER_NATIVE_FACE_LEFT`). Новый арт: вносить в `*_NATIVE_FACE_LEFT` **только** если файл нарисован влево. Вне боя (дом/магазин) котики по-прежнему вправо.

### Consequences
`paintSlots` / `pvpUnitCard` / `battleLoadFigureHtml` / `desiredSpriteFace(side)` — side-first. `D-040` остаётся для non-board type default + flip helper. Rule: `.cursor/rules/fight-facing.mdc`.

## D-050 · 2026-11-20 · Pause attack-card chrome compose

- **Status:** Accepted
- **Area:** hud | content
- **SSOT:** docs/FULL-SPEC.md §6
- **Owner:** Andrew / web-hud

### Context
Compose chrome (`D-045` / `D-049`) в превью оставался кривым (слоты/арт/руна). Выбор цели атаки в UI тоже отложен.

### Decision
**Pause:** вернуть цельные webp-плашки в руке/дом-колоде. Клиент шлёт `playCard` с пустым `targetId` — как раньше. Карты с `TargetRule=backline` (тыл) продолжают резолвиться на сервере. Ручной выбор цели / новый chrome — отдельная задача.

### Consequences
`D-045` → `Superseded by D-050` (HUD presentation). Механика §2.3 / §3.4 без изменений.

## D-046 · 2026-11-20 · Live fight: idle breathe on every unit

- **Status:** Accepted
- **Area:** hud
- **SSOT:** none (presentation; MF-149)
- **Owner:** Andrew / web-hud

### Context
В ch3/ch4 монстры «дышали», а котики и юниты с elemental aura казались статичными: CSS-класс `.aura-*` перетирал `animation` у `.idle-breathe-*`.

### Decision
**Locked:** любой живой cutout в live-fight HUD (practice / Mythmir PvE / PvP / yard wire) проходит через `decorateBattleUnitIdle`: idle breathe обязателен. Aura (filter pulse) — опционально в **том же** `animation` list; ch3/ch4 baked-glow монстры без aura. Мёртвые — без idle.

### Consequences
`battle-fx.js` задаёт combined inline animation; CSS `.aura-*` / `.idle-breathe-*` не ставят свой `animation`. Skill `docs/skills/web-hud.md` + `.cursor/rules/fight-idle-breathe.mdc`.

## D-045 · 2026-11-20 · Attack cards: one chrome + live data

- **Status:** Superseded by D-050
- **Area:** hud | content
- **SSOT:** docs/FULL-SPEC.md §6
- **Owner:** Andrew / web-hud

### Context
Карты атаки в HUD были цельными webp-плашками (рамка+название+арт+описание+AP). Правки текста/энергии требовали перерисовки арта; служебные filename-строки попадали в кадр.

### Decision
Одна нейтральная рамка (`chrome`) на все классы; название, описание, cost и иллюстрация подставляются из данных (`card-effects` / бой) поверх chrome. Стихия — позже только CSS tint (`data-element` / `--mf-card-tint`), не отдельные рамки. Иллюстрации на переходный период — кроп центра из старых плашек (`illust/`).

### Consequences
Paused — см. `D-050`. Механика §2.3 без изменений.

## D-044 · 2026-11-20 · Cursor: always-on Ponytail ruleset

- **Status:** Accepted
- **Area:** process
- **SSOT:** none (agent process; не механика FULL-SPEC)
- **Owner:** Andrew / orchestrator

### Context
Нужен набор «lazy senior / минимальный полный дифф» из [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail). Хуки Cursor требуют Node (`node …/cursor-hooks.js install`); на машине Node нет.

### Decision
Подключить **rule-only** вариант: `.cursor/rules/ponytail.mdc` (`alwaysApply: true`), текст с upstream. Mythfel SSOT (`FULL-SPEC`, antifailure шлюз, роли `docs/AGENTS.md`) не отменяется. Уровни `/ponytail lite|full|ultra|off` недоступны, пока нет hooks+Node.

### Consequences
Новые чаты в этом workspace получают Ponytail. Чтобы переключать уровни — поставить Node, клонировать ponytail и `node scripts/cursor-hooks.js install --project`, затем удалить `ponytail.mdc` (rule и hooks — альтернативы).

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
HUD не рисует `empty_lane` (класс `.hidden` — Tailwind `flex` иначе оставляет «пёс отдыхает»). Clear на стартерах — CI-гейт **по каждому уровню** на полном tank·DPS·heal (attrition carry отдельно). Солдаты: высокий HP + щиты танков, ATK↑ с гл.3–4 — без хила/танка больно (retune 2026-11-18 #2). Ch1 fighter art = `fighter-h` (не `fighter-b`/ch3). Ch2/питбосс: chip-heal soft + **reserve 1 E** so heal pack cannot starve pitboss attack (не +1 E глобально). Ch5 Гул: HP 95 + backline slash / cleave (retune 2026-11-18).

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

- **Status:** Superseded by D-047 (live board / load roster side rule)
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

- **Status:** Superseded by D-065
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

- **Status:** Accepted (число отрядов → `Superseded by D-054`)
- **Area:** hud
- **SSOT:** docs/FULL-SPEC.md §6 (`collection`); §1 cap 15 / presets×5
- **Owner:** web-hud

### Context
Экран `collection` был пустой Stitch-оболочкой («Пусто»×12), с фейк БМ/рангом прайда/резонансом % вне FULL-SPEC; bind искал несуществующие `.roster-list`. Риск принять клиентский power за SoT.

### Decision
На SL коллекция = **HUD stub**: ростер из `profile.cats` (как home — shop×12, D-027; farm вне боевого грида); редактируемые отряды 3v3 local (+ persist; cap presets[5] в модели) — число/имена: **D-054** (PvE · PvP · Данж · Рейд); фильтры роль/поиск. Без client SoT урона/наград. БМ / «резонанс %» / «Ранг V прайда» — не показывать как live. Серверный SavePreset — later. Каталог: `collection-stub.json` + `GET /api/dev/collection`.

### Consequences
+ Можно собрать связки для smoke. − Пресеты не SoT боя до backend. Follow-up: SavePreset RPC.

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
