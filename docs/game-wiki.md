# Мифиус — игровая вики (правила и механики)

**Статус:** LOCKED draft для MF-59 (Andrew) · бренд **Мифиус: Мифические котики**  
**SSOT ядра боя/скоупа:** `docs/FULL-SPEC.md` · эта вики = единый player-facing свод чисел и петель  
**Крипта / NFT / blockchain:** **запрещены** (бренд + prefs). «Мифиус»-монета = **внутриигровой soft currency**.

---

## Оглавление

1. [Скиллы и пассивы 12 героев](#1-скиллы-и-пассивы-12-героев)
2. [Двор — добыча ресурсов](#2-двор--добыча-ресурсов)
3. [HP по классам](#3-hp-по-классам)
4. [Атака и бой](#4-атака-и-бой)
5. [Уровни и статы](#5-уровни-и-статы)
6. [Алхимия и крафт](#6-алхимия-и-крафт)
7. [Скрещивание](#7-скрещивание)
8. [Экономика — таблицы](#8-экономика--таблицы)
9. [PvP 3v3 Колизей](#9-pvp-3v3-колизей)
10. [Мем-коин «Мифиус»](#10-мем-коин-мифиус)
11. [Закреплённые prefs (кратко)](#11-закреплённые-prefs-кратко)
12. [Ссылки](#12-ссылки)

---

## 1. Скиллы и пассивы 12 героев

Источник вариантов: `docs/class-variants-balance.md` / shop 6×2.  
Части: **глаза / уши** = пассив (active-style триггер); **морда / убор / спина / хвост** = карты N=4.  
Статусы MVP: `stun`, `poison`, `bleed`, `sleep`, `weak`, `vuln`, `fragile`, `taunt`, `stealth`, `ruffle`, `mint`, `cleanser` (FULL-SPEC §3.5).

### 1.1 Общая сетка

| # | Герой | Роль / стиль | Глаза (пассив) | Уши (пассив) | Карточный кит (кратко) |
|---|---|---|---|---|---|
| 1 | **Танк A** «Щит-утёс» | tank · hard-def | **Каменный взор** — при получении урона 1 раз/ход: щит +8% maxHP | **Уши валуна** — союзник с `taunt` получает −10% входящего | shield + taunt; слабый poke |
| 2 | **Танк B** «Пробой» | tank · pierce | **Трещина взора** — удар с `pierce` вешает `fragile` 1 ход (1/ход) | **Чуткость бреши** — vs цели с щитом: +15% ATK | pierce/fragile bash; 1 backline pierce cost 2 |
| 3 | **Боец A** «Парные когти» | fighter · dual+crit | **Искрящий взгляд** — после `hits:2` шанс 25% `ruffle`×1 | **Боевой слух** — крит-карта: +1 энергия раз в 2 хода | dual wield + crit; cost 1–2 |
| 4 | **Боец B** «Двуручный» | fighter · two-hand | **Яростный взор** — одиночный удар cost≥2: +10% ATK | **Рёв стали** — убийство: `ruffle`×2 себе | heavy single (7–11); 1 backline smash |
| 5 | **Ассасин A** «Тень» | assassin · stealth+crit | **Глаза мглы** — выход из `stealth`: следующий удар гарантированный crit | **Шёпот ветра** — уворот 15% vs `nearest` | crit + stealth evade |
| 6 | **Ассасин B** «Охотник тыла» | assassin · backline | **Прицел в спину** — `backline`-удар: +`poison` 2 хода | **Слух поддержки** — приоритет цели с ролью support +5% crit | all backline + crit |
| 7 | **Стрелок A** «Охотник» | ranger · lowest_hp | **Глаз добычи** — `lowest_hp` / `ambush`: +12% ATK | **Уши засады** — первая карта хода не снимает `stealth` союзника | hunter any-target + crit |
| 8 | **Стрелок B** «Град стрел» | ranger · AoE | **Широкий взор** — AoE: вторичные цели не ниже 50% hit (см. §4) | **Дальний слух** — cost-2 AoE: −1 cost раз в бой | heavy arrows `all_enemies` cost 2 |
| 9 | **Маг A** «Огонь» | mage · fire AoE | **Пламенный зрачок** — AoE fire: `vuln` 1 ход на главной цели | **Треск искр** — крит-карта: `weak` 1 ход | fire AoE + crit + debuff |
| 10 | **Маг B** «Лёд» | mage · ice control | **Ледяной взор** — single ice: `stun` 1 (не mass freeze) | **Холодный слух** — цель со `stun`: +`weak` | ice AoE; freeze=`stun`1 + weak |
| 11 | **Саппорт A** «Чистый родник» | support · heal/cleanse | **Целительный взгляд** — хил: +10% если цель <40% HP | **Уши очищения** — `cleanse` снимает ещё 1 DoT | pure heal + cleanse (без атаки) |
| 12 | **Саппорт B** «Прилив силы» | support · heal/buff | **Вдохновляющий взор** — ATK-бафф союзника: длится +1 ход | **Шёпот слабости** — вражеский `weak` усиливается на 1 стак раз в ход | heal + atk buff + enemy `weak` |

Числа пассивов — LiveOps-леверы; имена/триггеры LOCKED для вики.

### 1.2 Хвостовые пассивы мификов (заготовка)

Мифик (`rarity: mythic`, nursery) несёт **N=4** сильнейшие карты родителей **и** отдельный **хвостовой пассив** (слот `tail` passiveOps поверх карты — Phase 6). Предустановки по роли мифика:

| Роль мифика | Id пассива хвоста | Эффект |
|---|---|---|
| tank | `mythic_tail_aegis` | 1/бой: при падении <30% HP — щит 20% maxHP + `taunt` 1 |
| fighter | `mythic_tail_cleave` | Крит: splash 25% hit ближайшему врагу (не полный AoE) |
| assassin | `mythic_tail_venom` | Крит в тыл: `poison` 3 хода |
| ranger | `mythic_tail_mark` | Раз в 2 хода: пометить цель — союзники +10% vs неё |
| mage | `mythic_tail_echo` | После AoE: 30% шанс повторить 50% урона по самой раненой |
| support | `mythic_tail_tide` | После хила: снять `stun` **или** `sleep` с цели (1/ход) |

Смешанная роль мифика (resolve Phase 6): берётся пассив **доминирующей** роли родителей; tie → tank > fighter > assassin > ranger > mage > support.

### 1.3 Статусы (шпаргалка)

| Статус | Суть |
|---|---|
| `stun` / freeze | Пропуск действия 1 ход |
| `poison` / `bleed` | DoT в конце раунда |
| `sleep` | Как stun; сбивается уроном |
| `weak` / `vuln` | −ATK / +входящий урон |
| `fragile` | Урон игнорит shield (с `pierce`) |
| `taunt` / `stealth` | Принуд. цель / скрытие от nearest |
| `ruffle` → claw | 10 стаков → Claw Mode (FULL-SPEC §3.4) |

---

## 2. Двор — добыча ресурсов

**Анти-затоваривание (LOCKED числа day-1):** дневные минимумы сбора на активного игрока (сервер soft-cap выше; free без пасса не фармит бесконечно).

| Ресурс | Дневной min (гарант при визите) | Зачем |
|---|---|---|
| Дерево | **2–3** | крафт / кузня |
| Железо | **2** | кузня / tools repair |
| Овощи | **~1 ведро** | 1 зелье «еда»-линейки |
| Фрукты | **~1 ведро** | 1 зелье |
| Травы | **~1 ведро** | 1 зелье / алхимия |
| Рыба (hunger кота) | **3 / день** | сытость ферм-котов / питомца |

Правила двора:

1. **Износ инструментов** — лопата / топор / кирка: полный износ **~1 неделя** активного использования (≈7 дней тиков); ремонт на Рынке или scrap.
2. **Внешние культуры** (сад/поле вне укрытия) — могут быть **убиты** ивентом/погодой (LiveOps); не оставлять без сбора.
3. **Порча** — несобранный урожай портится за **~2 дня**.
4. Зоны: грядки · сад · рыбная заводя · лесопилка · рудник · карьер · кузня · склад алхимика (FULL-SPEC §4.4).
5. Pass ACTIVE → autofarm toggles (семена/bait/tools с Рынка) — `docs/armor-ranks-pass.md` §5.
6. Soft launch: HUD stub / tip; live loop = Phase 6.

---

## 3. HP по классам

База **уровня 1**, без брони (LOCKED вики). Танк = якорь **35**; далее лестница вниз.  
Масштаб **один** с картами: ATK / shield / heal на картах ≈ **2–10** = те же единицы, что HP (не «поинты» с множителем).  
Цель длины боя 3v3: **≤5 мин** (обычно ~3.5–4.5 мин / 4–5 раундов при ходе ~20–25 с).

| Класс | Base HP | Доля от танка |
|---|---|---|
| **tank** | **35** | 100% |
| **fighter** | **30** | 85% |
| **assassin** | **26** | 75% |
| **ranger** | **24** | 70% |
| **mage** | **21** | 60% |
| **support** | **19** | 55% |

Стартер (tank + fighter + support) ≈ **84** HP суммарно.  
Вариант B внутри класса: ±5% HP (танк B ≈ **33**, саппорт B ≈ **20**) — LiveOps.  
Рост HP от ранга — §5 (плоские +10/+20 были под старый якорь 1000; под масштаб 35 нужен отдельный LiveOps-ретьюн).

---

## 4. Атака и бой

Одно ядро PvP/PvE (prefs). Формация критична: **танк → боец → стрелок → саппорт** (lane 0 фронт → lane 2 тыл; в середине также ассасин, в тылу также маг) — store `docs/formation-targeting.md`, FULL-SPEC §2.1 / §3.4.

**Обычные удары** (`nearest`) бьют **фронт** вражеского строя. **Часть карт** бьёт **тыл / поддержку** (`targetRule: backline`, тег `backline` / тыл / rear).

### 4.1 UX атаки в тыл (LOCKED)

Когда дроп/добор даёт карту, которая **может бить дальних (тыловых) врагов**, игрок **обязан вытянуть эту карту из руки и навести её на выбранного героя**. Так работают **все** атаки с доступом к тылу: лучники, маги, ассасины с прыжком/ударом, любые карты с тегом backline / тыл / rear / support targeting. Без вытягивания и прицела карта в тыл не играет.

| Правило | Значение |
|---|---|
| Базовая атака (ориентир hit) | **~5–6** урона (типичная cost-1 карта) по незащищённой цели равного ранга; тяжёлые cost-2 ≈ **8–11** |
| Crit | **×2** к hit (вики supersedes старый ×1.5 SL stub) |
| AoE | Вторичные цели = **50%** hit основной |
| Life drain / HP refresh **в бою** | **Запрещены** (короткие PvP; хил саппорта = карты heal, не вампиризм) |
| Post-fight HP | Только **молоко на льду** в Таверне (не ranked-бафф) |
| Milk pre-buff | Только PvE + данжи; **не** ranked Колизей |
| Зелья | ≤1 / `potionId` на бой; крафтеры → рынок/аукцион |

Прочее ядро: энергия E1→E3, Milk Burst, Keep, Mouse Hour, Last Meow — FULL-SPEC §3.

---

## 5. Уровни и статы

| Событие | Эффект |
|---|---|
| Каждый **ранг** брони / player rank (R1→R8) | **+10** ко **всем** статам (`hp` scale, `atk`, `spd`, `skill`, `charm`) |
| Тот же ранг | **+20** к **primary** статам класса |

Primary по классу:

| Класс | Primary |
|---|---|
| tank | HP (+scale), charm |
| fighter | ATK, SPD |
| assassin | ATK, SPD |
| ranger | ATK, SPD |
| mage | Skill, ATK |
| support | Skill, charm |

Уровень кота (cat level) и rank unlock — раздельные оси: экип rarity по **рангу игрока** (grey→mythic), не по уровню кота (`docs/armor-ranks-pass.md`).

---

## 6. Алхимия и крафт

1. **Рецепты** продаются / открываются на **Рынке** (не в Таверне).
2. Успешный крафт **и** успешная алхимия дают **отдельные XP-треки** (`craft_xp`, `alchemy_xp`) — не смешиваются с rank XP боя.
3. Алхимия: травы/овощи/фрукты → зелья (`battle_potion` и utility).
4. Крафт: дерево/железо/scrap → tools, части кузни, расходники.
5. Pass autofarm_alchemy / autofarm_blacksmith — QoL, не ranked power buy.
6. Ошибка крафта / крит-крафт — LiveOps; вики фиксирует только «XP за успех».

Черновик XP:

| Действие | XP трека |
|---|---|
| Успешный craft 1 предмета | +10 `craft_xp` |
| Успешное зелье | +12 `alchemy_xp` |
| Рецепт редкости green+ | ×1.5 |

---

## 7. Скрещивание

Core fantasy: обычные → **мифические** (`docs/mythic-breeding.md`).

| Правило | Значение |
|---|---|
| Вход | 2 родителя + **ингредиенты** (больше видов, чем SL stub) |
| Шанс мифика | Малый (`nursery_mythic_chance`) |
| **Талисман удачи** | IAP (yarn) / shop: **+20%** к шансу мифика на **1** попытку |
| Оплата | **Только IAP / yarn** — не crypto |
| Мифик · карты | Пул ≤8 → **N=4** сильнейшие |
| Мифик · хвост | Пассив из §1.2 |
| SL | Форма + tip/codex; live = Phase 6 |

Ингредиенты (draft SKU, Магазин + Двор):

1. `breed_milk_essence` — эссенция молока  
2. `breed_moon_whisker` — лунный ус  
3. `breed_stone_purr` — каменный мур  
4. `breed_spark_pollen` — искрящая пыльца  
5. `breed_tide_scale` — чешуя прилива  
6. `talisman_mythic_luck` — талисман +20% (IAP, расходник)

---

## 8. Экономика — таблицы

Каналы LOCKED: `docs/shops-channels.md`. Soft: **fish** (и бренд-имя «Мифиус» как skin §10). Premium: **yarn**. Gear spend: **battle_coin / medals**. Craft: **scrap**.

### 8.1 Рынок — семена и инструменты (buy)

| SKU | Цена fish | Примечание |
|---|---|---|
| `seed_veg_bag` | 25 | 1 грядка овощей |
| `seed_fruit_bag` | 30 | фрукты |
| `seed_herb_bag` | 35 | травы / алхимия |
| `tool_shovel` | 80 | износ ~7 дней |
| `tool_axe` | 90 | дерево |
| `tool_pick` | 100 | железо |
| `tool_repair_kit` | 40 | полный ремонт 1 tool |
| `bait_basic` | 15 | рыбная заводя ×5 забросов |

### 8.2 Рынок — sell / quick sell (NPC)

| Ресурс | Sell fish |
|---|---|
| Дерево ×1 | 4 |
| Железо ×1 | 6 |
| Ведро овощей | 12 |
| Ведро фруктов | 14 |
| Ведро трав | 16 |
| Рыба ×1 | 5 |
| Зелье common | 40 |
| Scrap ×5 | 10 |

Quick sell = те же ставки, без аукциона.

### 8.3 Крафт / алхимия — costs (draft)

| Рецепт | Вход | Выход |
|---|---|---|
| `potion_life` | травы×1 + фрукты×1 + scrap×2 | зелье жизни |
| `potion_cleanse` | травы×2 + овощи×1 | отвар очищения |
| `potion_mint` | мята/травы×2 + рыба×1 | мятный отвар |
| Repair shovel | железо×1 + дерево×1 | durability full |
| Bow string (scrap gear) | scrap×10 + железо×2 | bow mat |

### 8.4 Магазин — коты / броня / breeding

| SKU | fish / yarn | Источник |
|---|---|---|
| 12 common cats | 800–950 fish | `shop-common-cats.md` |
| Grey armor R1 | 150–250 fish / slot | только R1 в shop |
| Breeding mats | 60–120 fish | shop |
| `talisman_mythic_luck` | **yarn** IAP pack | +20% breed |
| Pass season | yarn IAP | ×2 XP + autofarm |
| Fish packs | yarn → fish | shop |

Battle_coin gear: power band ≤ blue на SL (`armor-ranks-pass.md`).

### 8.5 Броня R1–R8 (unlock)

| Rank | Rarity | Гарантия пасса / сезон |
|---|---|---|
| 1 | grey | ×6 |
| 2 | green | ×3 |
| 3 | blue | ×3 |
| 4–8 | gold→mythic | ×1 each unlocked |

Темп: ~1 год до high ranks **с** пассом; без ≈2× медленнее.

### 8.6 Скрещивание — costs

| Попытка | Cost |
|---|---|
| Base attempt | 2 parents cooldown + mats ×1 set (~200–400 fish equiv.) |
| Talisman | yarn (IAP), +20% mythic chance once |

### 8.7 PvE / PvP earnings (draft / день free)

| Источник | fish | scrap | medals | прочее |
|---|---|---|---|---|
| Мифмир узел (win) | 25–60 | 2–6 | 1–3 | jar key rare |
| Данж first-clear | 100–180 | 10–20 | 8–15 | |
| Дуэль win | 15–30 | 1–3 | 2–5 | |
| Колизей win | 40–70 | 3–8 | 5–12 | +10 rating (§9) |
| Колизей lose | 10–20 | 1 | 1–3 | −3 rating |
| Двор daily min | mats (§2) | — | — | 3 fish hunger |

Pass: ×2 bowls/tickets и ×2 rank XP.

### 8.8 Стартовый грант

См. `docs/starter-pack.md`: tank+fighter+support equal decks; зелья×1; 1 farm-cat; без экипа; fish=200, scrap=20, bowls=3, tickets=5.

---

## 9. PvP 3v3 Колизей

| Правило | Значение |
|---|---|
| Формат | **3v3**, одно боевое ядро |
| ММ | Баланс по **рейтингу текущего armor rank** + soft MMR; кросс-плей mobile/web/Steam |
| Победа | **+10** rating |
| Поражение | **−3** rating |
| Рейтинг | **Отдельный** на каждый из **8** armor ranks (R1…R8) |
| Бафф-молоко | Запрещено |
| Life drain в бою | Запрещён (§4) |
| Анти-P2W | soft-cap rarity, pass=pace, potions cap — `armor-ranks-pass.md` |

Сезон арены ~28 дней (FULL-SPEC §4.3); ladder decay soft между сезонами.

---

## 10. Мем-коин «Мифиус»

**Не** blockchain / NFT / токен. Это **бренд-имя soft currency** (отображение поверх `fish` или alias wallet `mifius`).

### 10.1 Earn (faucets)

1. Победы Мифмир / Колизей / дуэли  
2. Daily двор (сдача лишних mats с капом)  
3. Успешный craft / alchemy (малый drip)  
4. Pass free track  
5. Tutorial / first-clear  
6. «Добыча Мифиуса» — **игровой** sink/faucet мини-loop на Дворе (см. ниже), не mining crypto

### 10.2 Spend (sinks)

1. Рынок: семена, tools, bait  
2. Магазин: common cats, grey armor, breeding mats  
3. Listing fee аукциона  
4. Repair tools  
5. Попытки скрещивания (часть mats в soft)  
6. Cosmetic rename / hub flair (post-SL)

### 10.3 «Майнинг» = геймплей

| Loop | Описание |
|---|---|
| Двор-сборы | Ежедневный cap → излишек **не** копится бесконечно (sell/craft или rot) |
| Крафт-сжигание | Рецепты жрут mats + soft |
| Колизей tickets | Билеты = sink времени/ресурса |
| Repair tax | Еженедельный износ tools |
| Auction tax | Комиссия лотов |

Premium **yarn** остаётся IAP; «Мифиус» не покупается за реальные деньги напрямую как crypto — только через fish packs / earn.

---

## 11. Закреплённые prefs (кратко)

1. PvP и PvE — одно ядро боя.  
2. UI: Axie-painted 2D vibe; тёплая сказка; **без крипты/NFT**.  
3. Строй критичен (танк→боец→стрелок→саппорт); обычные удары — фронт; часть карт бьёт в тыл — **вытянуть карту и навести на героя** (§4.1).  
4. Таверна = молоко; зелья у крафтеров.  
5. Каналы: Магазин / Таверна / Рынок / Аукцион — без пересечения.  
6. Броня R1–R8; пасс ×2 XP; гарантии боксов.  
7. Кроссплатформа: общий ММ.  
8. Навигация: Двор (route `farm`); PvE map = Мифмир (`yard`); База знаний ← сеты/карточки/кодексы.  
9. Стартовый набор equal decks.  
10. Цель: ordinary → mythic через скрещивание.

---

## 12. Ссылки

| Док | Путь |
|---|---|
| SSOT | `docs/FULL-SPEC.md` |
| Эта вики (репо) | `docs/game-wiki.md` |
| Class variants | store `docs/class-variants-balance.md` |
| Shops | store `docs/shops-channels.md` |
| Armor / pass | store `docs/armor-ranks-pass.md` |
| Breeding | store `docs/mythic-breeding.md` |
| Formation | store `docs/formation-targeting.md` |
| Starter | store `docs/starter-pack.md` |
| Prefs | store `preferences.md` |

База знаний (HUD `codex`): статья «Полная вики правил» → этот файл.
