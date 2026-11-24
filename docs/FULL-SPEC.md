# Мифоус / Mythfel — полное ТЗ приложения

**Версия:** 1.6 · **SSOT** (единственный источник правды для сборки)  
**Язык дока:** RU (строки игры: RU+EN)  
**Стек:** Unity C# URP 2D · Nakama · battle-service Go · LiveOps JSON  
**Крипта/NFT:** нет  

Читать агентам целиком **запрещено**, если задача узкая — см. `AGENTS.md` (только нужные §).

---

## §0. Продукт (locked)

| Поле | Значение |
|---|---|
| Имя | **Мифоус** / **Mythfel** |
| Питч | Мифические котики (роль+стихия), карточный пошаговый 3v3 |
| **Core fantasy** | Из **обычных** котов сделать **мифических** через скрещивание (питомник). Мифики редки; без free unlimited breeding |
| Аудитория | Подростки + взрослые |
| Платформы | Mobile (iOS, Android), PC (**Steam** + desktop), Web — **один** Unity-проект |
| Кросс-плей | Игроки матчятся **независимо от клиента** (mobile / web / desktop). Общий пул матчмейкинга; сегментации PvP по платформе нет |
| North Star | Кланы + рейтинг кланов |
| Soft launch | Мифмир (PvE, бывш. Двор) + PvP (+ магазин/пасс/гача + таверна/рынок/аукцион). Ферма, питомник, клан-босс = вкладка «Скоро» |
| Домены | `mifous.ru`, `mythfel.com` (зарегистрировать) |
| Bundle | `com.mythfel.game` |

**Не бренд:** Битва котиков/котов, Battle Cats, Axie, Lunacia.

**Платформы / дистрибуция (требования, без API сторов в SSOT):**  
- Цели: mobile stores, **Steam (PC)**, web-клиент.  
- Бой и награды — единый серверный авторитет (§3.6, §8.2); клиент только input + VFX.  
- Конкретные Steamworks / IAP / store SDK — вне SSOT; подключать отдельной задачей по чеклисту стора.

---

## §1. Скоуп soft launch (MUST)

### MUST
- Аккаунт (device + optional email/social later)
- Стартовый грант (§5.1): 3 боевых котика + идентичные колоды у всех новых игроков; коллекция 15 слотов / 5 пресетов
- 1 farm-cat в инвентаре при регистрации (без crop-геймплея на SL; см. §5.1)
- Бой 3v3 vs бот (Мифмир / PvE) и vs игрок (Дуэли + Арена 4 нед)
- Последовательные ходы, 4 карты/котик, пассивы глаз/ушей
- 5 ролей × 6 стихий (контент не обязан покрыть все 30 пар)
- Миски: 3 PvE / 5 PvP в день; пасс ×2
- Боевые зелья: ≤1 каждого вида на бой; на старте каталог SL ×1 (§5.1, §10)
- Гача + pity 50/80, показ шансов
- Платный пасс: ×2 лимитов + no-ads + трек наград
- Rewarded ads (без пасса)
- LiveOps-конфиг баланса/лимитов
- Реплеи последних 10 PvP
- RU+EN
- Вкладки «Скоро»: Клан-босс, Ферма, Питомник
- Кросс-платформенный PvP: общий матчмейкинг mobile / web / desktop (Steam PC в том же пуле)

### MUST NOT (SL)
- Реальный клан-босс / ферма / питомник геймплей (инвентарный farm-cat без сбора — ок, §5.1)
- P2W победа на арене
- Крипта, маркетплейс игроков за деньги
- 9 «нравов» Axie-стиль (у нас роли+стихии)
- Стартовая экипировка pendant/bow; RNG альтернативных стартовых колод

### POST-SL
Кланы полные → клан-босс 8–12 → ферма → питомник → сезоны контента.

---

## §2. Игровые сущности

### §2.1 Роли (ровно 6)

| role | Задача | Статы уклон | Обязательные теги карт |
|---|---|---|---|
| `tank` | Щит, дразнилка / пробой брони | HP↑ | `shield`, `taunt` (вариант B: `pierce`) |
| `fighter` | Физ. урон (парный/двуручный) | ATK↑ | `attack`, `ruffle` (+ `crit` у варианта A) |
| `assassin` | Уворот/крит / удар в тыл | SPD↑ | `attack`, `crit` (+ `stealth` / `backline`) |
| `mage` | Контроль/DoT/AoE | Skill-эффекты | `control`/`aoe` (+ `crit` fire / freeze→`stun` ice) |
| `ranger` | Приоритет целей / AoE | SPD↑ | `ambush`/`lowest_hp`/`aoe` |
| `support` | Хил/чистота/бафф | — | `heal`/`cleanse`/`buff` |

**Shop common (SL):** 6 классов × 2 варианта = **12** SKU (`common_cat`), у каждого свой **6-card kit** (§2.3, §6 Shop) — **72** attack cards total.  
Варианты (EN id): tank A hard-def+aggro (+guard bash / poke для finish) / tank B **armor pierce** (fragile/pierce, не raw ATK); fighter A dual+crit / B two-hand; assassin A evade+crit / B backline+crit; ranger A hunter any-target+crit / B heavy AoE; mage A fire AoE+crit+debuff / B ice AoE+freeze(1)+debuff; support A heal+cleanse (**+1** soft attack/smite) / B heal+buff/debuff (+finish). LiveOps retune `D-035`.

**Пресет 3v3:** tank + (fighter\|assassin\|ranger\|mage) + support.  
**Стартеры:** tank·stone, fighter·fire, support·water (`starter_tank_stone`, `starter_fighter_fire`, `starter_support_water`) — equal decks; shop common — доп. контент.

**Equal decks (fair PvP):** все новые аккаунты получают **один и тот же** фиксированный стартовый кит карт (те же `templateId` → части → карты). Без RNG и без альтернативных стартовых колод. Роли сохраняют свои колоды из content; кит команды идентичен между игроками (§5.1).

**Формация (критична, PvP = PvE):** слоты команды `lane 0..2` = фронт → тыл.  
Рекомендуемый порядок ролей: `tank` (фронт) → `fighter`/`assassin` (середина) → `mage`/`ranger`/`support` (тыл).  
**Newbie tip:** не ставить `support`/`ranger`/`mage` в авангард — они хрупкие и всё равно бьют freely; фронт = tank (и melee).  
Дефолт-пресет стартеров: lane0 tank → lane1 fighter → lane2 support.  
Порядок котиков в бою влияет на дефолтный таргет и тай-брейки (см. §3.4 Targeting).

### §2.2 Стихии (ровно 6)

| element | +15% vs | −15% vs |
|---|---|---|
| `fire` | grass, ice | water, stone |
| `water` | fire, stone | grass, bolt |
| `grass` | water, stone | fire, ice |
| `bolt` | water, ice | stone, grass |
| `stone` | bolt, fire | water, grass |
| `ice` | grass, stone | fire, bolt |

Родство (element карты = element котика): **+10%** atk/shield карты.

### §2.3 Части
`eyes`,`ears`,`muzzle`,`headwear`,`back`,`tail` → по **1 активной карте** каждый.  
Колода котика = **N=6**. Команда = до **18** (+ `meow?` мусор).  
Мифик из питомника (§4.4) тоже несёт ровно **N=6** карт (сильнейшие из смеси родителей).

### §2.4 Статы
`hp`, `spd`, `skill` (комбо `floor(atk*skill/500)` при ≥2 картах одним юнитом), `charm` (Последнее мяу).  
Тай-брейк: spd ↓hp ↑skill ↑charm ↓id.

### §2.5 Словарь предметов
| ID | Смысл |
|---|---|
| `gacha_jar` | Гача вне боя |
| `battle_potion` | Расходник в бою ≤1/type |
| `pendant` | 1 пассив/котик |
| `bow` | Мод карты части ≤4 |
| `fish` | Soft currency (game coins; packs в Shop) |
| `yarn` | Premium (IAP) |
| `scrap` | Craft |
| `medal` / `battle_coin` | Season / PvE·PvP spend в Shop на gear |
| `ingredient` | Farm/PvE (post-SL основной) |
| `armor` | Экип по rarity unlock rank R1–R8 (§5) |
| `tavern_milk` | Restore / PvE·dungeon pre-buff (не ranked PvP) |

---

## §3. Бой (правила симулятора)

### §3.1 Победа
Нокаут 3 врагов. Поражение: 0 своих HP / surrender / server timeout.

### §3.2 Ход
Sequential: P1 acts → resolve → P2 acts → resolve → round end (shield drop default, status ticks).

### §3.3 Старт энергии/добора (конфиг, дефолт)

| Turn | First | Second |
|---|---|---|
| 1 | E1 D* | E2 D* |
| 2–3 | E2 D* | E3 D* |
| 4+ | E3 D* | E3 D* |

`D*` — добор **на каждого живого юнита** из его draw pile; размер зависит от числа живых союзников стороны на **старт своего хода** (без Keep / `BonusDraw`):

| Живых союзников | D на юнита | Рука команды (HUD) |
|---|---|---|
| 3 | 2 | 6 |
| 2 | 3 | 6 |
| 1 | 4 | 4 |

При 3v3 расстановке старт = D2 на котика (как раньше). Умер один → D3 на оставшихся; остался один → D4 на стол.  
Unused energy не переносится. Unused cards не переносятся (кроме Keep).

**Цикл колоды атак (LOCKED, все режимы, одно ядро §3 / D-001):** per-unit draw pile → hand → discard, как Classic draw/discard:
1. **Розыгрыш** — сыгранная карта сразу в discard pile юнита.
2. **Конец хода** — оставшиеся в руке карты сбрасываются в discard (кроме карт с активным Keep).
3. **Старт хода** — добор `D` (+ `BonusDraw`) из draw pile; Keep-карты остаются в руке и **не** входят в счётчик добора.
4. **Ресайкл** — если draw pile пуст при доборе: discard перемешивается в draw pile (`battleSeed` RNG) и добор продолжается; цикл по кругу до конца боя.
5. Mode-layer (PvE / PvP / practice / босс / гильдия-demo) **не** дублирует и не отключает этот цикл.

### §3.4 Системы
- **Milk drops** → Milk Burst (+1 E forever; every 2nd burst +1 draw). Unspent E → drops+1.
- **Keep:** hold card into next own turn + milk; cost escalates same turn; kept card stays playable this turn.
- **Mouse Hour:** from turn 10 maxHP decay (config).
- **Ruffle→Claw Mode:** 10 stacks → +1E, draw1, +50% dmg; no drops/ruffle that turn.
- **Last Meow:** lethal → chance(charm) survive at 1 HP for N ticks.
- **Targeting (одно ядро PvP/PvE):** формация важна. Правила актёра:
  1. **Фронт (lane 0) melee** — `tank` / `fighter` / `assassin`: дефолт только **ближайший фронт врага** (меньший enemy lane, затем role-rank); второй ряд достаёт только AoE (`all_enemies`).
  2. **Середина/тыл melee** — `fighter` / `assassin` в lane 1–2: дефолт тот же nearest; дальше бьют карты с `targetRule: backline` (или тег `ranged`).
  3. **Free-target роли** — `ranger` / `mage` / `support` **в любом слоте**: любые `targetRule` + явный выбор цели (UI/input `explicitID`).
  - Дефолт `nearest`: сначала **меньший enemy lane** (фронт строя), затем role-rank  
    `tank` → `fighter` → `assassin` → `mage` → `ranger` → `support`;  
    затем nearer lane к актёру → меньший id.  
  - `backline`: приоритет тыла — `support` → `ranger` → `mage` → `assassin` → `fighter` → `tank`;  
    затем больший lane → nearer к актёру → id.  
  - Прочие: `self`, `ally_lowest_hp`, `ally_all`, `all_enemies`, `lowest_hp`, `random_enemy`.  
  - `ally_lowest_hp`: союзник с **макс. missing HP** (`MaxHP − HP`); tie-break меньший lane → меньший id. Не absolute HP (иначе full-HP support с малым MaxHP всегда «слабейший»).  
  - `lowest_hp` (враг): **absolute current HP** asc (wiki / D-035 «наименьшим HP»); stealth/taunt/ambush как у nearest. Не %HP и не missing.  
  - `random_enemy` (LOCKED `D-043`): seeded pick среди живых врагов (после stealth-filter); **taunt не редиректит** — нужен для spread DoT (яд убийц).  
  - Теги урона: `crit` → **×2** dmg (player wiki / MF-59; было ×1.5 SL stub); `pierce` / статус `fragile` → урон игнорит shield. Freeze = `stun` 1 ход. AoE вторичные цели = **50%** hit. Life drain / in-fight HP refresh запрещены (короткий PvP). Свод чисел: `docs/game-wiki.md`.  
  - Overrides: `taunt` принуждает цель (кроме `random_enemy`); в т.ч. `all_enemies`/AoE схлопывается на таунтеров (без splash мимо танка), free-target `explicitID` и melee named `backline` тоже редиректятся; `stealth` скрывает от обычного таргета; `ambush` (тег карты) обходит stealth.
  - Taunt duration: карты танка должны давать **duration ≥ 2** — тик в конце хода кастера иначе снимает duration=1 до хода врага.
  - **UX атаки в тыл (LOCKED):** когда дроп/добор даёт карту с доступом к дальним/тыловым врагам (`targetRule: backline`, тег `backline` / тыл / rear / support targeting — лучники, маги, ассасины с прыжком/ударом и т.п.), игрок **обязан вытянуть карту из руки и навести её на выбранного героя**; без вытягивания и прицела карта в тыл не играет. Обычные `nearest` удары бьют фронт; строй prefs: танк → боец → стрелок → саппорт. Player wiki: `docs/game-wiki.md` §4.1.
- **Potions (LOCKED):** loadout pre-match — **≤1 штуки каждого `potionId` в один бой** (хил / энергия / очищение и любой другой battle potion). Склад может хранить больше; в бой берут не больше 1/id. HUD-tray и Create* обязаны капить loadout (`D-052`).

### §3.5 Статусы MVP
`ruffle`, `claw_mode`, `mint`, `taunt`, `stealth`, `bleed`, `poison`, `sleep`, `stun`, `weak`, `vuln`, `fragile`, `cleanser`.

**Poison (LOCKED `D-043`):** не тикает по `duration` и **не спадает** сам — только копится. На конце хода стороны: урон = текущие `stacks`, затем `stacks += 1` (+1 урона за каждый следующий тик). Снятие: `cleanse` / `mint` (иcleanser-absorb на apply). `bleed` по-прежнему duration-based.

**HUD (D-032, D-041):** иконки статусов + длительность (ходы) видны всем; у poison длительность не показывают / `0` — важен стек (`×N`). `stun`/`sleep` → карты юнита в руке `playable:false` (пропуск хода). Щит (`shield` от танк-баффа) — отдельная шкала рядом с HP; в **PvP** шкалу щита видит только сторона баффера (враг не видит, кого бафнули). Cleanse/mint → `events[]` `statusOp:clear` по снятым дебаффам (видят все). Смерть: затемнение портрета + красный fatality по типу цели — котик → «котик отдыхает»; манекен (practice) → «манекен отдыхает»; PvE/данж/рейд-монстр → «{вид} отдыхает» (`пёс` / `волк` / `зомби` / `призрак` по фракции §4.1 / `D-039`).

### §3.6 Авторитет
Только server симулирует. Client = input + VFX.  
`battleSeed` + inputs → replay. Хранить 10 последних PvP/user.  
Один battle-service обслуживает все клиенты; кросс-плей (§0) не требует отдельной симуляции на платформу.

---

## §4. Режимы

### §4.1 Мифмир (PvE; бывш. «Двор»)
UI: **карта + список миссий**. Soft launch: **5 глав × 3 уровня** (солдаты → солдаты → питбосс+солдаты). Cost: 1 bowl / уровень. Rewards: fish, xp, scrap, jar keys.  
AI: scripted decks per node (server SoT).  
UI name: **Мифмир** (кампания / карта). Route id `yard` / `YardMap` сохраняется для совместимости.  
Отдельно: рейд/легион 8–12 (данжи на боссов) ≠ строй 3v3. Первый босс (UI): 3 волны (~6 / ~10 / босс+4); ядро боя остаётся 3v3.

**Главы · фракции врагов (LOCKED `D-039`):**

| Глава | Фракция | Локация (player) | Питбосс |
|---|---|---|---|
| 1 | Обычные псы | Железная Цитадель | Барон Гав |
| 2 | Северные волки | Ледяные Пещеры | Лютый Клык |
| 3 | Красные псы | Алая Псарня | Алый Вожак |
| 4 | Зомби | Чумные Склепы | Некропёс Мор |
| 5 | Призраки | Призрачный Чертог | Фантом Гул |

Уровни главы (`mythmir_{ch}_f{1..3}`): f1 солдаты · f2 солдаты · f3 **питбосс-волна** (расстановка по главе, `D-042`). Сложность растёт от гл.1 → гл.5; солдаты f1/f2 — высокий HP + щиты танков, с гл.3–4 сильнее card ATK (без танка·хила ожидаемо больно). Каждый питбосс **проходим на стартерах** без шмоток/допов при строе **танк · DPS (с backline) · саппорт** (lane 0→2) и **правильной тактике**; без неё — поражение ожидаемо.

**Энергия ботов (LOCKED `D-051`):** общий пул стороны за ход. Карты солдат **cost 1**; обычный удар босса **cost 1**; **масс-атака босса cost 2 = один удар** (не две атаки). При 3E: масс-удар босса (2) + leftover 1 солдатам по нужде (хил/щит/атака); две масс-атаки по 2E при 3E невозможны. Питбосс, ударяя цель с **taunt**, вешает **stun** (заморозка) на 1 ход — снимает cleanse саппорта. Ch4: удар по зомби → атакующему **+1 poison** (thorns). Ch5 призраки: **dodge ~25%** входящих ударов.

**Волны f1–f3 + питбосс (LOCKED `D-051`, sim lane 0=фронт → 2=тыл; supersedes f3 table of `D-042`):**

| Гл. | f1 | f2 | f3 | Тактика f3 |
|---|---|---|---|---|
| 1 | 3× боец | танк · лучник · лучник | соло-босс **фронт** (пустые mid/back); pierce/fragile; HP≈110 | Держать танк·хил; pierce игнорит щит |
| 2 | боец · хил · лучник | 3× лучник (`center`+taunt) | **хил · босс · хил**; босс **backline** leaps + `nearest` rend; хилы leftover heal | Taunt держит босса; stun с таунта; снять хилов |
| 3 | боец · танк · боец | убийца · танк · убийца (center/backline+taunt) | **танк · босс · танк**; босс масс **cost2** + bleed | Снять танка → до босса; чистить bleed |
| 4 | боец_a · убийца · боец_a (HP≈support) | боец_b · убийца · боец_b | **убийца · некро · убийца**; масс poison cost2; thorns | Чистить poison; рвать некро |
| 5 | танк · боец · хил | боец · хил · боец | **танк · босс · хил**; босс **backline** slashes + `nearest` + масс cost2; dodge | Taunt держит босса; снять хил; увороты |

**Прохождение главы (волны / уровни):**
1. После зачистки всех врагов уровня живые герои-котики получают **полное восстановление HP** при входе на следующий уровень той же главы (новый `CreatePvE`; живые спавнятся на MaxHP).
2. Герой, **убитый** на уровне 1 или 2 главы, **не воскресает** до конца главы (`carryAlive`); бой продолжают оставшиеся. Между главами отряд снова полный.
3. После **любого** исхода PvE-боя (победа/поражение) котики **устают**: нужно молоко в Таверне или ожидание **5–10 мин** (LiveOps `pve_fatigue_sec`, дефолт 420). На soft launch — **stub** (код/UI tip есть; жёсткий блок старта можно выкл. флагом).

### §4.2 Дуэли
Unranked/points. Unlock after `pve_unlock_n=3` успешных **PvE или practice** боёв. Cost: 1 pvp ticket.  
Practice: отдельный экран «Тренировочный лагерь» (`practice`).  
**HUD paint (LOCKED `D-034`):** в лобби/победе строй рисуется **слева→направо** как тыл · центр · авангард (**танк справа**). Симуляторные `lane 0..2` остаются фронт→тыл (§2.1); `CreatePvE.team` = sim-порядок, не зеркало UI.

### §4.3 Арена
Season 28 days. Rating. Same anti-P2W. Soft-cap pendant/bow rarity optional via LiveOps.

### §4.4 Post-SL stubs (UI only на SL)
- Clan boss 8–12, 1 cat each, shared HP, turn-based  
- Farm daily visit or crop rot (на SL: вкладка «Скоро»; 1 farm-cat в инвентаре без сбора — §5.1). **Зоны усадьбы (HUD stub / Phase 6):** грядки (пшеница · травы · бахча/мята), сад, **рыбная заводя**, лесопилка (дровосек), рудник (шахтёр), карьер (каменотёс), кузня (кузнец), склад алхимика. Сбор/крафт на SL = tip, не live loop.  
- **Nursery / скрещивание** (SL: форма + tip, без live breed; Phase 6 — authority на сервере):

#### §4.4.1 Питомник — core fantasy (LOCKED)
**Цель игрока:** превращать **обычных** котов в **мифических** через скрещивание.  
Не free unlimited breeding: коты/мифики остаются редкими (prefs + UI tip).

| Правило | Значение |
|---|---|
| Вход | 2 родителя (обычные или выше) + breeding ingredients (Shop / farm post-SL) |
| Шанс мифика | **Малый** (`nursery_mythic_chance`, LiveOps; дефолт низкий, не «часто») |
| Не-мифик исход | Обычный кот (не гарантированный power-creep); детали non-mythic kit — LiveOps Phase 6 |
| Мифик · карты | Пул = до **12** карт родителей (6+6). Из пула берутся **N=6 сильнейшие** → сет мифика |
| Сила карты | LiveOps `card_power` (дефолт: `atk + shield`; tie-break `cardId` asc). Не клиент |
| Мифик · прочее | `rarity: mythic`, `origin: nursery`; роль/стихия/части — серверный resolve Phase 6 (не выдумывать на SL) |
| SL UI | Экран `breeding` / Soon «Питомник» показывает tip core fantasy; CTA gated («Подними ранг» / «Скоро»). На SL = **HUD stub** (`D-030`): форма + выбор родителей local; без live breed / client roll |

**MUST NOT:** клиент как SoT награды/набора карт мифика; NFT/mint язык; безлимитный free breed.

### §4.5 Бой гильдий (GvG)
Guild vs guild (клан vs клан). Сторона выставляет **3–12** котов. Soft currency only; без крипты.  
**Soft launch:** HUD-вход + правила; матчмейкинг / полный борд 4–12 = gated tip («Подними ранг в боях») до liveops flag.  
**Ядро боя:** размер **3** переиспользует текущий 3v3 simulator (`CreatePvE`/`CreatePvP`); 4–12 — расширение battle-core (не в SL MUST).  
Не путать с **клан-боссом** (§4.4: 1 кот с участника, shared HP).

---

## §5. Экономика и монетизация

| Источник | Free | Pass |
|---|---|---|
| PvE/day | 3 | 6 |
| PvP/day | 5 | 10 |
| Rank XP | 1.0× | **2.0×** |
| Ads | rewarded bonuses | hidden |
| Gacha pity | soft50 / hard80 | same |

Pass track: cosmetics, bows, fish, jar keys, **armor boxes by current rank** (гарантии сезона: R1×6 common; green+blue×3; R4+ ×1 each rarity unlocked).  
**Pass ACTIVE perk — автономная ферма (Phase 6 / HUD stub на SL):** при активном платном пассе и купленных seeds/consumables на Рынке — фермеры auto-harvest + replant; gather mats → склад алхимика (auto-craft зелий); дровосек/шахтёр/каменотёс auto-gather → кузнец; кузнец может включить auto-craft выбранных предметов. Без ACTIVE пасса тумблеры gated. Сервер авторитетен; клиент не SoT.  
IAP: yarn packs, pass, slot expand, maybe jar bundles.  
Server validates all purchases.

**Каналы торговли (не смешивать):**
- **Shop** — IAP/donate, pass, fish packs, breeding ingredients, 12 common cats, common (grey R1) starter armor; `battle_coin`/medals с PvE/PvP → полезный gear при здоровом онлайне.
- **Tavern** — молоко на льду = post-fight HP restore; **другие молока** = pre-fight баффы **только PvE + данжи** (не ranked PvP/арена). Зелья крафтеров — не здесь.
- **Market** — семена, расходные tools (shovel/axe/pick), sell crafted resources, **quick sell** лута по серверной цене без аукциона.
- **Auction** — player-listed cats / weapons·armor / ingredients **по своей цене** (soft currency only; без денег/крипты).

**Броня ↔ unlock rank:** grey R1 → green R2 → blue R3 → gold R4 → purple R5 → epic R6 → legendary R7 → mythic R8. Темп: high ranks ≈ **1 год с пассом**; без пасса ≈ **2× медленнее**. Нельзя купить skip ранга. Детали балансных рычагов — LiveOps (soft-cap rarity в ranked, XP curve, box weights).

**Анти-P2W арены:** нельзя купить победу; potions capped; tavern milk buffs banned in ranked; power farmable; pass = pace not ceiling.

### §5.1 Starter grant (регистрация)

Выдаётся **атомарно** сервером при создании профиля (`NewPlayer` + `GrantStarterKit`). Клиент не inventорит награды.

| Позиция | Значение |
|---|---|
| Боевые коты | `starter_tank_stone` + `starter_fighter_fire` + `starter_support_water` (level 1, rarity common, `origin: starter`) |
| Колоды | 3×6 карт с частей `eyes/ears/muzzle/headwear/back/tail`; **идентичный кит у всех новых игроков** (equal decks / fair PvP, §2.1) |
| Пресет | lane0 tank → lane1 fighter → lane2 support |
| Зелья | все 6 id каталога SL (§10) — **×1** каждого |
| Экипировка | **нет** pendant / bow |
| Farm-cat | **1** × `starter_farm_grass` (`origin` farm); crop-loop **выкл.** до Phase 6 / `feature_flags.farm_gameplay`; UI «Скоро» |
| `bowls` | 3 (дневной кап free) |
| `pvpTickets` | 5 (spend после unlock `pve_unlock_n=3`) |
| `fish` | 200 |
| `scrap` | 20 |
| `yarn` | 0 |
| `medals` | 0 |
| Jar key | 0 при регистрации |

**Tutorial rewards** (отдельно от регистрационного гранта, после первой победы Двора / `test_yard_1`): +50 fish, +1 `potion_life`, +1 jar key.  
Доп. farm-cats — unlock/buy с уровнем (LiveOps-цены; не стартовый грант).

---

## §6. Экраны (клиент)

Минимальный граф:

1. `Boot` → patch/LiveOps fetch  
2. `Title` / login  
3. `Hub` chrome: **один** shared header (`#appNav` / `#appSubTabs`, web-hud; `D-029`). Primary **LOCKED `D-033`** (порядок): **Боевой пропуск** · **Дом Хранителя** · **Торговля** · **Бои** · **Гильдии** · **Рейтинги** · **Друзья** · **База знаний** + subtabs — канон `docs/nav-ia.md` (не менять без нового D-0xx). Дефолт Дома = `home`; `farm` = Soon. Мифмир = хаб боёв (`battle_hub`) + PvE map (`yard` / `pve`) под **Бои**.  
4. `YardMap` (Мифмир) → Formation 3v3 → `Battle`; рейд/легион — отдельный экран  
5. `PvPMenu` (Дуэли/Арена) → matchmaking → `Battle`  
6. `Collection` (cats, presets×5, pendants/bows) — на SL = HUD stub (`D-031`): ростер из профиля + **3 отряда** 3v3 local (cap presets[5]); без client SoT урона/БМ/резонанса; серверный SavePreset — later  
6b. `Склад` (`gear`) — амбар игрока: grid / фильтры / inspect / надеть; на SL = HUD stub (`D-028`); не «склад алхимика» (§4.4). Клиентский экип не SoT боя (§7.1 pendant/bow).
6c. `Скрещивание` (`breeding`) — питомник / алтарь; на SL = HUD stub (`D-030`, §4.4.1): form + tip, без live breed; Phase 6 = server SoT.
7. `Shop` (yarn/IAP, jars, pass, fish packs, breeding ingredients, **common_cat** ×2×6 = 12 SKU, grey R1 armor; battle_coin gear)
7b. `Tavern` — молоко на льду (post-fight HP) + PvE/dungeon milk buffs; зелья крафтеров → market/auction  
7c. `Market` — seeds, tools, craft sell, **quick sell**  
7d. `Auction` — player listings (cats, gear, ingredients) at own price  
7e. `Codex` / `Login` / `Practice` — day-1 формы  
7f. `Guild` + `GuildBattle` (GvG 3–12; SL: entry + tip, §4.5)  
8. `Pass` (×2 XP + rank boxes + autofarm perk copy when ACTIVE)  
8b. `Farm` Soon sheet — expanded zones incl. fishing + autofarm toggles (gated / stub; §4.4)  
9. `Battle` HUD: board 3+3, hand, energy, end turn, potion tray (≤1/id); soft-launch fight tray = hand + right act (AP · end turn · auto · pots) во всех live-режимах (`D-052`); **ход игрока (D-053, все live-режимы):** тап по карте = **выбор** (toggle + highlight), карты не уходят из руки; **ЗАВЕРШИТЬ ХОД** применяет выбранные по очереди (сервер `playCard` + FX), затем `endTurn` → ход врага (таймер / VFX); авто-бой может играть сразу без очереди. **Keep** — механика §3.4 остаётся, **кнопка Keep в SL HUD снята**; статусы/щит/смерть — §3.5 + `D-032`; **ход противника (VFX, все режимы):** 6 карт атаки **рубашкой** к игроку (сброс/бросок), затем карты исчезают — без раскрытия руки соперника. **Карты атаки в руке (D-050):** цельные webp-плашки (как soft-launch); compose chrome / ручной выбор цели — **pause**. TargetRule=backline резолвится на сервере без UI-pick. **Презентация героев (`D-037`):** на live-борде (`battle` / `practice_fight` / `pvp_fight`) — полнорост **без фона** (cutout); на всех прочих формах — портрет **с фоном**. **Facing (`D-047`, board):** на live/load борде колонка **слева** смотрит **вправо**, колонка **справа** — **влево** (к центру; CSS `scaleX` / `.mf-sprite-face`). Вне боя котики по умолчанию вправо (`D-040` type default). Новый арт: в `*_NATIVE_FACE_LEFT` только если файл нарисован влево. **Силуэт (`D-048`, live cutouts):** визуальный рост по роли assassin/mage < ranger < support < fighter < tank (CSS `--mf-role-h`/`--mf-role-w` на art-well); общий bump выше прежнего baseline; монстры (солдаты/боссы) и манекены — та же шкала и wells по `data-role`, что у котиков; lobby-портреты без шкалы

10. `Result` + rewards  
11. `ReplayList` (10)  
12. `Soon` placeholder sheets  

Адаптив (web-hud): stage **landscape** (~16:9). На **телефоне** — только landscape; portrait → rotate gate (`D-036`, MF-145). Отдельные mobile/tablet shells — после wide web (`D-012`). PC = keyboard hotkeys later.

---

## §7. Данные (схемы)

### §7.1 CatInstance
```
catId, templateId?, role, element, level, xp,
parts: {eyes,ears,muzzle,headwear,back,tail}, // partIds
pendantId?, bowByPart: {muzzle?, headwear?, back?, tail?},
rarity, origin: starter|farm|jar|workshop|nursery
```
`origin: farm` — инвентарный farm-cat (§5.1); на SL без crop-геймплея.  
`origin: nursery` + `rarity: mythic` — мифик из скрещивания (§4.4.1); колода = N=6 сильнейших карт смеси родителей.  
**HUD Склад (`D-028`):** слоты `helm`/`armor`/… на soft launch — stub UI; SoT экипа = `pendantId` + `bowByPart`. Бой не читает клиентский warehouse.

### §7.2 CardDef (data-driven)
```
cardId, name_key, roleGate?, element, cost, atk, shield, hits,
targetRule, tags[], effectOps[]  // DSL ops, не хардкод C#
// targetRule: nearest | backline | self | ally_lowest_hp | ally_all | all_enemies | lowest_hp | random_enemy
// tags: crit | pierce | aoe | ambush | backline | ranged | …
// backline-атаки: ≥1 карта с attack+backline на роли (tank/fighter/assassin/mage/ranger/…)
```

### §7.3 PartDef
`partId, slot, element, cardId?, passiveOps[], artKey, rarity`

### §7.4 LiveOps Config (remote)
`class_mods, energy_table, milk_thresholds, mouse_hour, limits, pity, shop, season, feature_flags`

### §7.5 Player
`userId, fish, yarn, scrap, medals, bowls, pvpTickets, passActiveUntil, cats[], presets[5], potions[], pendingAdsCap`  
**Warehouse (post-SL / D-028 follow-up):** `gear[]` (owned item instances) + equip map — отдельная backend-задача. На SL HUD stub; бой читает только `pendantId`/`bowByPart` (§7.1), не клиентский warehouse.

---

## §8. API / сервисы

### §8.1 Nakama
Auth, storage profile, friends, clans (basic), leaderboards (arena), matchmaker tickets, wallet mirror optional.  
Matchmaker: **общий пул** для всех клиентов; ticket/query **не** фильтрует по `platform` / store (кросс-плей §0). Метаданные клиента (os/build) — только аналитика/диагностика.

### §8.2 battle-service (Go)
| RPC | In | Out |
|---|---|---|
| `CreatePvE` | stageId, team, potions | battleId |
| `CreatePvP` | matchId, teams | battleId |
| `SubmitAction` | battleId, playCards[] / keep[] / potion / endTurn | stateDiff |
| `GetReplay` | battleId | frames |

Reject illegal actions. Rate-limit. Log seed+inputs.  
Один сервис для mobile / web / desktop (Steam); протокол боя платформо-независим.

### §8.3 Economy-service (может быть модуль Nakama + hooks)
Grant rewards, spend currency, open jar (server RNG + pity), activate pass, validate IAP receipt, daily refill bowls/tickets (timezone UTC+0 or player tz later).  
`GrantStarterKit` — атомарно с `NewPlayer` по таблице §5.1 (fixed templates, без RNG колод).

### §8.4 LiveOps CDN
Signed JSON, versioned. Client caches; server authoritative for combat numbers.  
Local SL wiring: stub on `http://localhost:8090` (см. `ЗАПУСК.md`). Production signing keys **out of repo**.  
Phase 4 geo (§14): ops ISO allowlist + analytics `soft_launch_flag` (§11); not store credentials.

---

## §9. Архитектура клиента Unity

```
Assets/
  Game/Battle/     # presenter only
  Game/UI/
  Game/Meta/       # hub, collection, shop
  Game/Net/        # Nakama + battle client
  Game/Data/       # Scriptable/Addressables defs (mirror server ids)
  Game/LiveOps/
```

Правила:
- Никакой боевой логики «только на клиенте» для онлайн/наград.
- Addressables для артов карт.
- Localization: Unity Locale RU/EN, keys = `name_key`.
- Целевые билды: mobile, web, **PC/Steam** из одного проекта; UI mobile-first (§6), PC-hotkeys later.
- Не выдумывать в SSOT/коде store-specific API (Steamworks и т.п.) без отдельной задачи.

---

## §10. Контент минимум SL

| Тип | Кол-во |
|---|---|
| Card parts | 40–50+ (≥8/role incl. assassin; shop 12×4 kits) |
| Eye/ear passives | 10–16 |
| Pendants | 12 |
| Bows | 16 |
| Potions | 6 (каталог ниже) |
| PvE nodes | ≥15 = **5 глав × 3 уровня** (Мифмир SL, §4.1 / `D-039`) |
| Starter cats | 3 боевых + 1 farm-cat template (`starter_farm_grass`) |
| Jar tables | 2 (cats, gear) |

Карты: короткие имена, ≤140 символов эффекта RU.

**Battle potions (SL каталог, грант ×1 — §5.1):**

| potionId | RU (name_key) |
|---|---|
| `potion_life` | Зелье жизни |
| `potion_stone_skin` | Зелье Каменной Шкуры |
| `potion_spark_claw` | Эликсир Искрящих Когтей |
| `potion_nine_lives` | Настой Девяти Жизней |
| `potion_cleanse` | Отвар Очищения |
| `potion_mint` | Мятный боевой отвар |

Числа эффектов — LiveOps / potion JSON (не хардкод клиента).

---

## §11. Аналитика (обязательные события)

`tutorial_step`, `battle_start`, `battle_end`, `card_played`, `pve_node_clear`, `pvp_match_end`, `jar_open`, `iap_success`, `pass_buy`, `ad_reward`, `daily_limits`, `session_start/end`, `soft_launch_flag`.

---

## §12. Нефункциональные

- Battle PvP latency: action ack &lt; 500ms p95 (регион).  
- Anti-cheat: server sim, replay audit.  
- Privacy: GDPR/152-ФЗ baseline (privacy policy URL).  
- Gacha odds displayed.  
- Crash-free sessions &gt; 99% soft launch target.  
- Offline: Мифмир **optional later**; SL = online required for progress.

---

## §13. Acceptance soft launch

1. Туториал → победа в Мифмире &lt;10 мин на стартерах.  
2. 3 PvE + 5 PvP лимиты соблюдаются server-side.  
3. Пасс ×2 и no-ads.  
4. Гача pity срабатывает на hard 80.  
5. Нелегальный card play отвергается.  
6. Реплей PvP открывается.  
7. «Скоро» вкладки видны, не крашат.  
8. RU/EN переключение.  
9. IAP sandbox yarn → jar.  
10. LiveOps смена `limits` без ребилда клиента.

---

## §14. Фазы поставки (без календарных сроков)

| Phase | Done when |
|---|---|
| 0 Preprod | этот SSOT + арт-направление + каталог карт draft |
| 1 Slice | 3v3 vs bot на server seed |
| 2 PvE | главы 1–3 + прогрессия |
| 3 PvP+$ | дуэли, арена, магазин, пасс, ads, pity |
| 4 Soft launch | §13 зелёный на ограниченном гео (ops allowlist + device smoke; CDN signed JSON); кросс-плей в одном матчмейкинг-пуле; Steam — целевой PC-канал (сборка/дистрибуция, без обязательного store SDK в SL-gate) |
| 5 Clans/boss | North Star жив |
| 6 Farm/nursery | daily retention + **core fantasy** breed→mythic (§0, §4.4.1) |
| 7 LiveOps seasons | контент без смены ядра |

---

## §15. Репозитории (рекомендуемая нарезка)

1. `mythfel-client` (Unity)  
2. `mythfel-battle` (Go)  
3. `mythfel-liveops` (JSON + CI validate schemas)  
4. Nakama Lua/Go modules в `mythfel-backend` **или** внутри battle monorepo  

CI: schema validate card JSON; battle golden replays; client compile.

---

## §16. Открыто только если ломает сборку

Иначе агент **не спрашивает**, берёт дефолт:
- `pve_unlock_n = 3`
- TZ игрока для рефилла = UTC  
- Soft-cap рарности на арене = off до фазы 5  
- Mobile-first soft launch (UX); кросс-плей и Steam как PC-цель — locked §0  
- Матчмейкинг без сегментации по платформе  

---

### Player wiki
Свод правил для Базы знаний / дизайна чисел (HP по классам, двор, экономика, Колизей ±rating, мем-коин «Мифиус» soft): **`docs/game-wiki.md`**. При конфликте чисел с черновиками content JSON — вики + этот SSOT; content подтянуть отдельной задачей.

---

*Конец SSOT v1.6. Механика-расширение и лор — приложения, не дублировать сюда.*
