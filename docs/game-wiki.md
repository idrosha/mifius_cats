# Мифиус — игровая вики (правила и механики)

**Статус:** LOCKED draft для MF-59 (Andrew) · бренд **Мифиус: Мифические котики**  
**SSOT ядра боя/скоупа:** `docs/FULL-SPEC.md` · эта вики = единый player-facing свод чисел и петель  
**Крипта / NFT / blockchain:** **запрещены** (бренд + prefs). «Мифиус»-монета = **внутриигровой soft currency**.

---

## Оглавление

1. [Скиллы и пассивы 12 героев](#1-скиллы-и-пассивы-12-героев) · [§1.4 арты карт batch 1–5](#14-арты-карт-атак-batch-1-5)
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

### 1.4 Арты карт атак (batch 1–5)

Каталог файлов: `docs/attack-cards/` (в Project store зеркало: `media/attack-cards/`).  
Папка на героя; имя файла = `attack_{templateId}_{part}.png`.

| # | Герой | templateId | Папка | Есть арт |
|---|---|---|---|---|
| 1 | Танк A «Щит-утёс» | `shop_tank_stone_a` | [`01-tank-a-shit-utes`](attack-cards/01-tank-a-shit-utes/) | muzzle · headwear · back · tail |
| 2 | Танк B «Пробой» | `shop_tank_stone_b` | [`02-tank-b-proboy`](attack-cards/02-tank-b-proboy/) | muzzle · headwear · back · tail |
| 3 | Боец A «Парные когти» | `shop_fighter_fire_a` | [`03-fighter-a-parnye-kogti`](attack-cards/03-fighter-a-parnye-kogti/) | muzzle · headwear · back · tail |
| 4 | Боец B «Двуручный» | `shop_fighter_fire_b` | [`04-fighter-b-dvuruchnyy`](attack-cards/04-fighter-b-dvuruchnyy/) | eyes · ears · muzzle · headwear · back · tail |
| 5 | Ассасин A «Тень» | `shop_assassin_bolt_a` | [`05-assassin-a-ten`](attack-cards/05-assassin-a-ten/) | eyes · ears · muzzle · headwear · back · tail |
| 6 | Ассасин B «Охотник тыла» | `shop_assassin_bolt_b` | [`06-assassin-b-ohotnik-tyla`](attack-cards/06-assassin-b-ohotnik-tyla/) | eyes · ears · muzzle · headwear · back · tail |
| 7 | Стрелок A «Охотник» | `shop_ranger_grass_a` | [`07-ranger-a-ohotnik`](attack-cards/07-ranger-a-ohotnik/) | eyes · ears · muzzle · headwear · back · tail |
| 8 | Стрелок B «Град стрел» | `shop_ranger_grass_b` | [`08-ranger-b-grad-strel`](attack-cards/08-ranger-b-grad-strel/) | eyes · ears · muzzle · headwear · back · tail |
| 9 | Маг A «Огонь» | `shop_mage_fire_a` | [`09-mage-a-ogon`](attack-cards/09-mage-a-ogon/) | eyes · ears · muzzle · headwear · back · tail |
| 10 | Маг B «Лёд» | `shop_mage_ice_b` | [`10-mage-b-led`](attack-cards/10-mage-b-led/) | eyes · ears · muzzle · headwear · back · tail |
| 11 | Саппорт A «Чистый родник» | `shop_support_water_a` | [`11-support-a-chistyy-rodnik`](attack-cards/11-support-a-chistyy-rodnik/) | eyes · ears · muzzle · headwear · back · tail |
| 12 | Саппорт B «Прилив силы» | `shop_support_water_b` | [`12-support-b-priliv-sily`](attack-cards/12-support-b-priliv-sily/) | eyes · ears · muzzle · headwear · back · tail |

**Аудит после batch 5:** у всех 12 героев есть папка и полный **N=4 kit**. Eyes/ears proposal ещё нет у Танк A/B и Боец A.

Текст на артах = playable numbers (масштаб HP §3). Eyes/ears — proposal `docs/stitch-prompts-eyes-ears-active.md` (ещё не SSOT N=6).

#### Танк A «Щит-утёс»

| Part | Карта | cost | Эффект на арте |
|---|---|---|---|
| muzzle | Каменный оскал | 1 | shield 8 · таунт 2 |
| headwear | Галька-шлем | 1 | shield 10 |
| back | Щит-валун | 1 | shield 9 · таунт |
| tail | Хвост-утёс | 1 | 4 nearest · таунт |

![Каменный оскал](attack-cards/01-tank-a-shit-utes/attack_shop_tank_stone_a_muzzle.png)

![Галька-шлем](attack-cards/01-tank-a-shit-utes/attack_shop_tank_stone_a_headwear.png)

![Щит-валун](attack-cards/01-tank-a-shit-utes/attack_shop_tank_stone_a_back.png)

![Хвост-утёс](attack-cards/01-tank-a-shit-utes/attack_shop_tank_stone_a_tail.png)

#### Танк B «Пробой» *(batch 4)*

| Part | Карта | cost | Эффект на арте |
|---|---|---|---|
| muzzle | Пробой когтем | 1 | 5 nearest · хрупкость 2 · Пробой |
| headwear | Щит-осколок | 1 | shield 6 · таунт 2 |
| back | Бронелом | 1 | 5 nearest · Пробой |
| tail | Хвост-пробой | 2 | 5 тыл · пробой · хрупкость 1 |

![Пробой когтем](attack-cards/02-tank-b-proboy/attack_shop_tank_stone_b_muzzle.png)

![Щит-осколок](attack-cards/02-tank-b-proboy/attack_shop_tank_stone_b_headwear.png)

![Бронелом](attack-cards/02-tank-b-proboy/attack_shop_tank_stone_b_back.png)

![Хвост-пробой](attack-cards/02-tank-b-proboy/attack_shop_tank_stone_b_tail.png)

#### Боец A «Парные когти» *(batch 4)*

| Part | Карта | cost | Эффект на арте |
|---|---|---|---|
| muzzle | Парный укус | 1 | 3 ×2 · крит · взъерошить |
| headwear | Искры-когти | 1 | 3 ×2 · взъерошить |
| back | Критовсечь | 1 | 4 nearest · крит · взъерошить |
| tail | Двойной хлыст | 2 | 3 ×2 тыл · крит |

![Парный укус](attack-cards/03-fighter-a-parnye-kogti/attack_shop_fighter_fire_a_muzzle.png)

![Искры-когти](attack-cards/03-fighter-a-parnye-kogti/attack_shop_fighter_fire_a_headwear.png)

![Критовсечь](attack-cards/03-fighter-a-parnye-kogti/attack_shop_fighter_fire_a_back.png)

![Двойной хлыст](attack-cards/03-fighter-a-parnye-kogti/attack_shop_fighter_fire_a_tail.png)

#### Боец B «Двуручный»

| Part | Карта | cost | Эффект на арте |
|---|---|---|---|
| eyes | Яростный взор | 2 | 8 nearest · кровотечение 2 · Порез |
| ears | Рёв стали | 1 | 5 nearest · хрупкость 1 · кровотечение 1 · Увечье/Порез |
| muzzle | Двуручный удар | 2 | 9 nearest · взъерошить *(batch 4)* |
| headwear | Тяжёлый оскал | 1 | 7 nearest · взъерошить ×2 *(batch 4)* |
| back | Молот жара | 2 | 11 nearest *(batch 4)* |
| tail | Тяжёлый хлыст | 2 | 8 тыл · взъерошить *(batch 4)* |

![Яростный взор](attack-cards/04-fighter-b-dvuruchnyy/attack_shop_fighter_fire_b_eyes.png)

![Рёв стали](attack-cards/04-fighter-b-dvuruchnyy/attack_shop_fighter_fire_b_ears.png)

![Двуручный удар](attack-cards/04-fighter-b-dvuruchnyy/attack_shop_fighter_fire_b_muzzle.png)

![Тяжёлый оскал](attack-cards/04-fighter-b-dvuruchnyy/attack_shop_fighter_fire_b_headwear.png)

![Молот жара](attack-cards/04-fighter-b-dvuruchnyy/attack_shop_fighter_fire_b_back.png)

![Тяжёлый хлыст](attack-cards/04-fighter-b-dvuruchnyy/attack_shop_fighter_fire_b_tail.png)

#### Ассасин A «Тень»

| Part | Карта | cost | Эффект на арте |
|---|---|---|---|
| eyes | Глаза мглы | 1 | 3 nearest · стан 1 |
| ears | Шёпот ветра | 1 | 4 nearest · яд 2 |
| muzzle | Теневой укус | 1 | 3 nearest · крит *(batch 4)* |
| headwear | Ускользнуть | 1 | стелс 1 на себя *(batch 4)* |
| back | Крит из тени | 1 | 6 nearest · крит *(batch 4)* |
| tail | Исчезновение | 2 | 5 nearest · крит · стелс 1 *(batch 4)* |

![Глаза мглы](attack-cards/05-assassin-a-ten/attack_shop_assassin_bolt_a_eyes.png)

![Шёпот ветра](attack-cards/05-assassin-a-ten/attack_shop_assassin_bolt_a_ears.png)

![Теневой укус](attack-cards/05-assassin-a-ten/attack_shop_assassin_bolt_a_muzzle.png)

![Ускользнуть](attack-cards/05-assassin-a-ten/attack_shop_assassin_bolt_a_headwear.png)

![Крит из тени](attack-cards/05-assassin-a-ten/attack_shop_assassin_bolt_a_back.png)

![Исчезновение](attack-cards/05-assassin-a-ten/attack_shop_assassin_bolt_a_tail.png)

#### Ассасин B «Охотник тыла»

| Part | Карта | cost | Эффект на арте |
|---|---|---|---|
| eyes | Прицел в спину | 1 | 4 тыл · крит · яд 2 |
| ears | Слух поддержки | 1 | 3 тыл · стан 1 |
| muzzle | Укол в тыл | 1 | 5 тыл · крит *(batch 4)* |
| headwear | Тихий разряд | 1 | 4 тыл · крит *(batch 4)* |
| back | Пронзить тыл | 1 | 6 тыл *(batch 4)* |
| tail | Казнь сзади | 2 | 7 тыл · крит *(batch 4)* |

![Прицел в спину](attack-cards/06-assassin-b-ohotnik-tyla/attack_shop_assassin_bolt_b_eyes.png)

![Слух поддержки](attack-cards/06-assassin-b-ohotnik-tyla/attack_shop_assassin_bolt_b_ears.png)

![Укол в тыл](attack-cards/06-assassin-b-ohotnik-tyla/attack_shop_assassin_bolt_b_muzzle.png)

![Тихий разряд](attack-cards/06-assassin-b-ohotnik-tyla/attack_shop_assassin_bolt_b_headwear.png)

![Пронзить тыл](attack-cards/06-assassin-b-ohotnik-tyla/attack_shop_assassin_bolt_b_back.png)

![Казнь сзади](attack-cards/06-assassin-b-ohotnik-tyla/attack_shop_assassin_bolt_b_tail.png)

#### Стрелок A «Охотник»

| Part | Карта | cost | Эффект на арте |
|---|---|---|---|
| eyes | Глаз добычи | 1 | 4 lowest_hp · засада · слабость 1 |
| ears | Уши засады | 1 | 4 nearest · засада · кровотечение 2 · Порез |
| muzzle | Метка охотника | 1 | 6 lowest_hp · засада · крит *(batch 3)* |
| headwear | Прицельный укус | 1 | 5 lowest_hp · засада *(batch 3)* |
| back | Стрела в тыл | 1 | 5 тыл *(batch 3)* |
| tail | Крит-засада | 1 | 6 nearest · засада · крит *(batch 3)* |

![Глаз добычи](attack-cards/07-ranger-a-ohotnik/attack_shop_ranger_grass_a_eyes.png)

![Уши засады](attack-cards/07-ranger-a-ohotnik/attack_shop_ranger_grass_a_ears.png)

![Метка охотника](attack-cards/07-ranger-a-ohotnik/attack_shop_ranger_grass_a_muzzle.png)

![Прицельный укус](attack-cards/07-ranger-a-ohotnik/attack_shop_ranger_grass_a_headwear.png)

![Стрела в тыл](attack-cards/07-ranger-a-ohotnik/attack_shop_ranger_grass_a_back.png)

![Крит-засада](attack-cards/07-ranger-a-ohotnik/attack_shop_ranger_grass_a_tail.png)

#### Стрелок B «Град стрел»

| Part | Карта | cost | Эффект на арте |
|---|---|---|---|
| eyes | Широкий взор | 2 | 2 всем · слабость 1 · AoE *(batch 2)* |
| ears | Дальний слух | 1 | 4 lowest_hp · кровотечение 1 · Порез *(batch 2)* |
| muzzle | Град стрел | 2 | 4 всем · засада · AoE |
| headwear | Тяжёлые стрелы | 2 | 3 всем · AoE |
| back | Метка слабого | 1 | 5 lowest_hp · засада |
| tail | Залп по площади | 2 | 4 всем · засада · тыл |

![Широкий взор](attack-cards/08-ranger-b-grad-strel/attack_shop_ranger_grass_b_eyes.png)

![Дальний слух](attack-cards/08-ranger-b-grad-strel/attack_shop_ranger_grass_b_ears.png)

![Град стрел](attack-cards/08-ranger-b-grad-strel/attack_shop_ranger_grass_b_muzzle.png)

![Тяжёлые стрелы](attack-cards/08-ranger-b-grad-strel/attack_shop_ranger_grass_b_headwear.png)

![Метка слабого](attack-cards/08-ranger-b-grad-strel/attack_shop_ranger_grass_b_back.png)

![Залп по площади](attack-cards/08-ranger-b-grad-strel/attack_shop_ranger_grass_b_tail.png)

#### Маг A «Огонь»

| Part | Карта | cost | Эффект на арте |
|---|---|---|---|
| eyes | Пламенный зрачок | 1 | 4 nearest · уязвимость 1 |
| ears | Треск искр | 1 | 5 nearest · крит · слабость 1 |
| muzzle | Огненный круг | 2 | 3 всем · слабость 1 · AoE *(batch 5)* |
| headwear | Искра-крит | 1 | 4 nearest · крит |
| back | Волна жара | 2 | 3 всем · крит · AoE |
| tail | Ожог тыла | 1 | 5 тыл · уязвимость 1 |

![Пламенный зрачок](attack-cards/09-mage-a-ogon/attack_shop_mage_fire_a_eyes.png)

![Треск искр](attack-cards/09-mage-a-ogon/attack_shop_mage_fire_a_ears.png)

![Огненный круг](attack-cards/09-mage-a-ogon/attack_shop_mage_fire_a_muzzle.png)

![Искра-крит](attack-cards/09-mage-a-ogon/attack_shop_mage_fire_a_headwear.png)

![Волна жара](attack-cards/09-mage-a-ogon/attack_shop_mage_fire_a_back.png)

![Ожог тыла](attack-cards/09-mage-a-ogon/attack_shop_mage_fire_a_tail.png)

#### Маг B «Лёд»

| Part | Карта | cost | Эффект на арте |
|---|---|---|---|
| eyes | Ледяной взор | 2 | 5 nearest · стан 1 *(batch 3)* |
| ears | Холодный слух | 1 | 5 nearest · слабость 2 *(batch 3)* |
| muzzle | Ледяная буря | 2 | 3 всем · AoE |
| headwear | Морозный укус | 1 | 4 nearest · стан 1 |
| back | Холодный фронт | 2 | 3 всем · AoE |
| tail | Заморозка тыла | 2 | 4 тыл · слабость 1 |

![Ледяной взор](attack-cards/10-mage-b-led/attack_shop_mage_ice_b_eyes.png)

![Холодный слух](attack-cards/10-mage-b-led/attack_shop_mage_ice_b_ears.png)

![Ледяная буря](attack-cards/10-mage-b-led/attack_shop_mage_ice_b_muzzle.png)

![Морозный укус](attack-cards/10-mage-b-led/attack_shop_mage_ice_b_headwear.png)

![Холодный фронт](attack-cards/10-mage-b-led/attack_shop_mage_ice_b_back.png)

![Заморозка тыла](attack-cards/10-mage-b-led/attack_shop_mage_ice_b_tail.png)

#### Саппорт A «Чистый родник»

| Part | Карта | cost | Эффект на арте |
|---|---|---|---|
| eyes | Целительный взгляд | 1 | heal 6 ally_lowest_hp |
| ears | Уши очищения | 1 | heal 3 ally_lowest_hp · очищение ×2 |
| muzzle | Капля жизни | 1 | heal 5 слабейшему союзнику *(batch 5)* |
| headwear | Чистый родник | 1 | heal 4 · снимает 1 дебафф *(batch 5)* |
| back | Волна опеки | 2 | heal 3 всем союзникам *(batch 5)* |
| tail | Очищение | 1 | heal 4 · снимает 1 дебафф *(batch 5)* |

![Целительный взгляд](attack-cards/11-support-a-chistyy-rodnik/attack_shop_support_water_a_eyes.png)

![Уши очищения](attack-cards/11-support-a-chistyy-rodnik/attack_shop_support_water_a_ears.png)

![Капля жизни](attack-cards/11-support-a-chistyy-rodnik/attack_shop_support_water_a_muzzle.png)

![Чистый родник](attack-cards/11-support-a-chistyy-rodnik/attack_shop_support_water_a_headwear.png)

![Волна опеки](attack-cards/11-support-a-chistyy-rodnik/attack_shop_support_water_a_back.png)

![Очищение](attack-cards/11-support-a-chistyy-rodnik/attack_shop_support_water_a_tail.png)

#### Саппорт B «Прилив силы»

| Part | Карта | cost | Эффект на арте |
|---|---|---|---|
| eyes | Вдохновляющий взор | 1 | ATK +2 союзнику на 3 хода *(batch 3)* |
| ears | Шёпот слабости | 1 | 5 nearest · слабость 2 *(batch 3)* |
| muzzle | Лёгкий хил | 1 | heal 4 раненому союзнику |
| headwear | Боевой настрой | 1 | ATK +2 союзнику на 2 хода |
| back | Прилив силы | 2 | heal 3 всем · щит 2 · бафф ATK +1 |
| tail | Ослабить врага | 1 | 3 nearest · слабость 1 |

![Вдохновляющий взор](attack-cards/12-support-b-priliv-sily/attack_shop_support_water_b_eyes.png)

![Шёпот слабости](attack-cards/12-support-b-priliv-sily/attack_shop_support_water_b_ears.png)

![Лёгкий хил](attack-cards/12-support-b-priliv-sily/attack_shop_support_water_b_muzzle.png)

![Боевой настрой](attack-cards/12-support-b-priliv-sily/attack_shop_support_water_b_headwear.png)

![Прилив силы](attack-cards/12-support-b-priliv-sily/attack_shop_support_water_b_back.png)

![Ослабить врага](attack-cards/12-support-b-priliv-sily/attack_shop_support_water_b_tail.png)

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
| Арты карт (batch 1–5) | `docs/attack-cards/` · store `media/attack-cards/` |

База знаний (HUD `codex`): статья «Полная вики правил» → этот файл.
