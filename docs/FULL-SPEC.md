# Мифоус / Mythfel — полное ТЗ приложения

**Версия:** 1.5 · **SSOT** (единственный источник правды для сборки)  
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

**Shop common (SL):** 6 классов × 2 варианта = **12** SKU (`common_cat`), у каждого свой 4-card kit (§2.3, §6 Shop).  
Варианты (EN id): tank A hard-def+aggro / tank B **armor pierce** (fragile/pierce, не raw ATK); fighter A dual+crit / B two-hand; assassin A evade+crit / B backline+crit; ranger A hunter any-target+crit / B heavy AoE; mage A fire AoE+crit+debuff / B ice AoE+freeze(1)+debuff; support A heal+cleanse / B heal+buff/debuff.

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
`eyes`,`ears` → пассив только.  
`muzzle`,`headwear`,`back`,`tail` → по 1 карте.  
Колода котика = 4. Команда = до 12 (+ `meow?` мусор).

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
| 1 | E1 D3 | E2 D4 |
| 2–3 | E2 D4 | E3 D4 |
| 4+ | E3 D5 | E3 D5 |

Unused energy/cards не переносятся (кроме Keep).

### §3.4 Системы
- **Milk drops** → Milk Burst (+1 E forever; every 2nd burst +1 draw). Unspent E → drops+1.
- **Keep:** hold card for milk; cost escalates same turn.
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
  - Прочие: `self`, `ally_lowest_hp`, `ally_all`, `all_enemies`, `lowest_hp`.  
  - Теги урона: `crit` → ×1.5 dmg; `pierce` / статус `fragile` → урон игнорит shield. Freeze = `stun` 1 ход.  
  - Overrides: `taunt` принуждает цель; `stealth` скрывает от обычного таргета; `ambush` (тег карты) обходит stealth.
- **Potions:** loadout pre-match, ≤1 per potionId.

### §3.5 Статусы MVP
`ruffle`, `claw_mode`, `mint`, `taunt`, `stealth`, `bleed`, `poison`, `sleep`, `stun`, `weak`, `vuln`, `fragile`, `cleanser`.

### §3.6 Авторитет
Только server симулирует. Client = input + VFX.  
`battleSeed` + inputs → replay. Хранить 10 последних PvP/user.  
Один battle-service обслуживает все клиенты; кросс-плей (§0) не требует отдельной симуляции на платформу.

---

## §4. Режимы

### §4.1 Мифмир (PvE; бывш. «Двор»)
UI: **карта + список миссий**. Soft launch: **5 стейджей × 3 боя** (мелкие → средние → мелкие+питбосс). Cost: 1 bowl. Rewards: fish, xp, scrap, jar keys.  
AI: scripted decks per node.  
UI name: **Мифмир** (кампания / карта). Route id `yard` / `YardMap` сохраняется для совместимости.  
Отдельно: рейд/легион 8–12 (данжи на боссов) ≠ строй 3v3. Первый босс (UI): 3 волны (~6 / ~10 / босс+4); ядро боя остаётся 3v3.

### §4.2 Дуэли
Unranked/points. Unlock after `pve_unlock_n=3` успешных **PvE или practice** боёв. Cost: 1 pvp ticket.  
Practice: отдельный экран «Тренировочный лагерь» (`practice`).

### §4.3 Арена
Season 28 days. Rating. Same anti-P2W. Soft-cap pendant/bow rarity optional via LiveOps.

### §4.4 Post-SL stubs (UI only на SL)
- Clan boss 8–12, 1 cat each, shared HP, turn-based  
- Farm daily visit or crop rot (на SL: вкладка «Скоро»; 1 farm-cat в инвентаре без сбора — §5.1). **Зоны усадьбы (HUD stub / Phase 6):** грядки (пшеница · травы · бахча/мята), сад, **рыбная заводя**, лесопилка (дровосек), рудник (шахтёр), карьер (каменотёс), кузня (кузнец), склад алхимика. Сбор/крафт на SL = tip, не live loop.  
- Nursery breed with ingredients  

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
| Колоды | 3×4 карты с частей `muzzle/headwear/back/tail`; **идентичный кит у всех новых игроков** (equal decks / fair PvP, §2.1) |
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
3. `Hub` chrome: primary (Персонаж · Бои · Торговля · Гильдии · Чаты · Боевой пасс · Рейтинги) + subtabs; PvE map = **Мифмир**  
4. `YardMap` (Мифмир) → Formation 3v3 → `Battle`; рейд/легион — отдельный экран  
5. `PvPMenu` (Дуэли/Арена) → matchmaking → `Battle`  
6. `Collection` (cats, presets×5, pendants/bows)  
7. `Shop` (yarn/IAP, jars, pass, fish packs, breeding ingredients, **common_cat** ×2×6 = 12 SKU, grey R1 armor; battle_coin gear)
7b. `Tavern` — молоко на льду (post-fight HP) + PvE/dungeon milk buffs; зелья крафтеров → market/auction
7c. `Market` — seeds, tools, craft sell, **quick sell**
7d. `Auction` — player listings (cats, gear, ingredients) at own price
7e. `Codex` / `Login` / `Practice` — day-1 формы  
7f. `Guild` + `GuildBattle` (GvG 3–12; SL: entry + tip, §4.5)  
8. `Pass` (×2 XP + rank boxes + autofarm perk copy when ACTIVE)  
8b. `Farm` Soon sheet — expanded zones incl. fishing + autofarm toggles (gated / stub; §4.4)  
9. `Battle` HUD: board 3+3, hand, energy, milk, keep, end turn, potion tray  
10. `Result` + rewards  
11. `ReplayList` (10)  
12. `Soon` placeholder sheets  

Адаптив: mobile-first; PC = keyboard hotkeys later.

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

### §7.2 CardDef (data-driven)
```
cardId, name_key, roleGate?, element, cost, atk, shield, hits,
targetRule, tags[], effectOps[]  // DSL ops, не хардкод C#
// targetRule: nearest | backline | self | ally_lowest_hp | ally_all | all_enemies | lowest_hp
// tags: crit | pierce | aoe | ambush | backline | ranged | …
// backline-атаки: ≥1 карта с attack+backline на роли (tank/fighter/assassin/mage/ranger/…)
```

### §7.3 PartDef
`partId, slot, element, cardId?, passiveOps[], artKey, rarity`

### §7.4 LiveOps Config (remote)
`class_mods, energy_table, milk_thresholds, mouse_hour, limits, pity, shop, season, feature_flags`

### §7.5 Player
`userId, fish, yarn, scrap, medals, bowls, pvpTickets, passActiveUntil, cats[], presets[5], potions[], pendingAdsCap`

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
| PvE nodes | ≥15 across 3 chapters |
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
| 6 Farm/nursery | daily retention loop |
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

*Конец SSOT v1.2. Механика-расширение и лор — приложения, не дублировать сюда.*
