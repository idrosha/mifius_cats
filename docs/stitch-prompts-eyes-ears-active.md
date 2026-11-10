# Stitch prompts — eyes/ears → активные карты (12 героев)

**Статус:** PROPOSAL (ждёт апрува Andrew → патч FULL-SPEC §2.3 + wiki §1)  
**Суть:** у каждого из 12 героев сейчас **4 активные** карты (`muzzle` / `headwear` / `back` / `tail`) + **2 пассива** (`eyes` / `ears`). Пассивы переводим в **активные карты руки** — итого **N=6** уникальных карт на героя.  
**Существующий арт 4 карт:** `docs/stitch-prompts-attack-cards-12-heroes.md` (не трогать).  
**Этот файл:** только **+2 карты** на героя (`eyes` + `ears`) + баланс + промпты Stitch.

SSOT сегодня (LOCKED до апрува): `eyes`/`ears` = пассив · N=4 (`FULL-SPEC` §2.3, `card-count-axie.md`). Этот пакет — **дизайн-предложение**, не silent override.

---

## 0. Баланс-рамка (обязательна)

Энергия хода не меняется (E1→E3). Больше уникальных карт = **больше выбора**, не больше урона за ход.

| Правило | Значение |
|---|---|
| Слоты | `eyes` + `ears` → по 1 **активной** карте |
| Стоимость | почти все **cost 1**; cost 2 только у «тяжёлого» CC/AoE |
| Урон | ATK **2–5** (ниже сигнатур кита); без второго «молота» на глаза/уши |
| Статусы | длительность **1–2**; hard CC (`stun`) — **≤1 карта** на героя |
| Копии в колоде | при N=6 → **1 копия** каждой карты (18 на команду 3v3). Две копии ×6 = 36 — слишком жирно |
| Мифик | пул родителей до **12** → N=6 сильнейших (после апрува SSOT) |
| Пассивы глаз/ушей | **снимаются** — эффект переезжает на карту (не стакать пассив+карту) |

### Классовая идентичность CC (запрос)

| Роль | Тема глаз/ушей |
|---|---|
| tank A | щит / таунт-опора |
| tank B | пробой / `fragile` |
| fighter | `bleed` (порезы) + `ruffle` / `fragile` (увечья) |
| assassin | `stun` и/или `poison` |
| ranger | метка / `weak` / `bleed` + ambush |
| mage fire | `vuln` / `weak` |
| mage ice | `stun` (дорого) + `weak` |
| support A | heal / cleanse |
| support B | ATK-бафф / `weak` |

### Контроль hard CC на поле

Носители `stun` в новых картах: **Ассасин A** (eyes), **Ассасин B** (ears), **Маг B** (eyes cost 2).  
Остальные — DoT / soft (`bleed`/`poison`/`weak`/`vuln`/`fragile`). Не плодить третий стан у файтеров/рейнджеров.

---

## 1. Сводная таблица — какие карты добавить

Уже есть (не генерить заново): 4 карты из `stitch-prompts-attack-cards-12-heroes.md`.  
**Добавить:** строки ниже (24 карты = 12×2).

| # | Герой | templateId | Part | RU title | cost | target | numbers / tags | Зачем (vs старый пассив) |
|---|---|---|---|---|---|---|---|---|
| 1 | Танк A «Щит-утёс» | `shop_tank_stone_a` | eyes | Каменный взор | 1 | self | shield 7 | Бывший on-hit щит → явный spend |
| 1 | | | ears | Уши валуна | 1 | ally | shield 5 · если у цели `taunt` → shield +3 | Бывший −10% входящего союзнику с taunt |
| 2 | Танк B «Пробой» | `shop_tank_stone_b` | eyes | Трещина взора | 1 | nearest | atk 4 · `pierce` · `fragile` 1 | Бывший fragile-on-pierce |
| 2 | | | ears | Чуткость бреши | 1 | nearest | atk 5 · `pierce` | Бывший +ATK vs щит → чуть сильнее poke |
| 3 | Боец A «Парные когти» | `shop_fighter_fire_a` | eyes | Искрящий взгляд | 1 | nearest | atk 3 · hits:2 · `bleed` 2 | Dual + порезы |
| 3 | | | ears | Боевой слух | 1 | nearest | atk 4 · crit · `bleed` 1 · `ruffle`×1 | Бывший +E на крит → ruffle (без free energy) |
| 4 | Боец B «Двуручный» | `shop_fighter_fire_b` | eyes | Яростный взор | 2 | nearest | atk 8 · `bleed` 2 | Тяжёлый порез (cost 2) |
| 4 | | | ears | Рёв стали | 1 | nearest | atk 5 · `fragile` 1 · `bleed` 1 | Увечье + порез |
| 5 | Ассасин A «Тень» | `shop_assassin_bolt_a` | eyes | Глаза мглы | 1 | nearest | atk 3 · `stun` 1 | Стан из тени |
| 5 | | | ears | Шёпот ветра | 1 | nearest | atk 4 · `poison` 2 | Яд (A раньше без poison) |
| 6 | Ассасин B «Охотник тыла» | `shop_assassin_bolt_b` | eyes | Прицел в спину | 1 | backline | atk 4 · crit · `poison` 2 | Бывший poison на backline → на карте |
| 6 | | | ears | Слух поддержки | 1 | backline | atk 3 · `stun` 1 | Стан тыловой саппорт |
| 7 | Стрелок A «Охотник» | `shop_ranger_grass_a` | eyes | Глаз добычи | 1 | lowest_hp | atk 4 · ambush · `weak` 1 | Метка добычи |
| 7 | | | ears | Уши засады | 1 | nearest | atk 4 · ambush · `bleed` 2 | Засадный порез |
| 8 | Стрелок B «Град стрел» | `shop_ranger_grass_b` | eyes | Широкий взор | 2 | all_enemies | atk 2 · aoe · `weak` 1 | AoE suppress (cost 2) |
| 8 | | | ears | Дальний слух | 1 | lowest_hp | atk 4 · `bleed` 1 | Дешёвый finish vs weak |
| 9 | Маг A «Огонь» | `shop_mage_fire_a` | eyes | Пламенный зрачок | 1 | nearest | atk 4 · `vuln` 1 | Бывший vuln с AoE → single spend |
| 9 | | | ears | Треск искр | 1 | nearest | atk 3 · crit · `weak` 1 | Бывший weak с крита |
| 10 | Маг B «Лёд» | `shop_mage_ice_b` | eyes | Ледяной взор | 2 | nearest | atk 3 · `stun` 1 | 2-й стан в ките, **cost 2** (есть cost-1 «Морозный укус») |
| 10 | | | ears | Холодный слух | 1 | nearest | atk 3 · `weak` 2 | Добивание контроля |
| 11 | Саппорт A «Чистый родник» | `shop_support_water_a` | eyes | Целительный взгляд | 1 | ally_lowest_hp | heal 6 | Бывший +10% low-HP → плоский heal 6 |
| 11 | | | ears | Уши очищения | 1 | ally_lowest_hp | heal 3 · `cleanse`×2 | Усиленный cleanse |
| 12 | Саппорт B «Прилив силы» | `shop_support_water_b` | eyes | Вдохновляющий взор | 1 | ally | ATK buff +2 · 3 хода | Бывший +1 длительности → длинный бафф |
| 12 | | | ears | Шёпот слабости | 1 | nearest | atk 2 · `weak` 2 | Явный weak-spend |

### Баланс-чек (кратко)

| Линия | Вывод |
|---|---|
| Tank A | Без нового ATK — только щиты; не конкурирует с DPS |
| Tank B | +pierce poke; ATK 4–5 ниже «Бронелом» 6 |
| Fighter A/B | Bleed вместо free energy/on-kill пассивов; B eyes cost 2 ≈ ниже «Молот жара» 11 |
| Assassin | A = nearest stun+poison; B = backline poison+stun — не оба бьют фронт станом |
| Ranger | A single-target CC; B AoE weak cost 2 (не спам) |
| Mage | Fire soft CC; Ice второй stun дорогой |
| Support | A без атаки; B weak слабее хвоста «Ослабить врага» (atk 2 vs 3, но weak×2) |
| Команда 3v3 | ~18 уникальных карт; энергия та же → пик DPS/ход не растёт линейно |

---

## 2. How to paste into Stitch

1. Вставь **§3 Master art brief** один раз.  
2. Дальше — **один герой за раз** (§4.1…§4.12): блок в \`\`\` целиком.  
3. Каждый промпт = **ровно 2 card faces** (`eyes` + `ears`), тот же frame language, что у уже существующих 4 карт героя.  
4. При дрейфе: *«Keep Tavern Hearth Battler; painted 2D attack cards; soft element tint; Russian titles; no crypto, no kindergarten, no purple-on-white.»*

### Export naming

| Что | Паттерн | Пример |
|---|---|---|
| Одна карта | `attack_{templateId}_{part}` | `attack_shop_assassin_bolt_a_eyes` |
| Пара глаз/уши | `attackkit_{templateId}_eyes_ears` | `attackkit_shop_fighter_fire_b_eyes_ears` |

`part` ∈ `eyes` | `ears`.

---

## 3. Master art brief (вставить первым)

```
Asset art for «Мифиус: Мифические котики» (Mythfel) — ATTACK / SKILL CARDS for the battle HUD hand.
Not full app screens. Not gear/armor cards. Not shop cat portraits as the main deliverable.

Product / style:
- Turn-based 3v3 card battler with combat mythic cats (боевые мифики).
- Art direction: «Tavern Hearth Battler» — cozy dark fantasy tavern: peat charcoal canvas (#161310 / #14110F), aged hearthstone / carved wood card frames, bronze clasps, warm lantern / amber-gold light (#D99B26 / #fdba45), aged vellum (#F4E8D1) for title plaque.
- Classic early Axie Infinity vibe as HAND-CARD clarity ONLY: painted / illustrated 2D, warm fairy-tale combat — NOT late soft-3D Axie, NOT crypto/NFT chrome, NOT kindergarten cute.
- Mood: hearthside spellbook / tavern battle — storybook craft, casual-cool power fantasy, still cozy.

Card format (mobile battle HUD):
- Vertical collectible skill card, portrait ~2:3, rounded-lg game card, readable at thumbnail in a hand.
- Layout per card: (1) top-left COST GEM (amber/gold circle with energy cost 1 or 2, large), (2) center painted scene of the effect (cat eyes / ears / claws / spells — clearly cats), (3) bottom title plaque with RU card name, (4) optional tiny chips for target/status (Щит, Стан, Яд, Порез, Увечье, Слабость…).
- Soft element frame tint ONLY as a thin accent (not neon): stone = warm grey-ochre · fire = soft ember · bolt = soft amber-gold · grass = soft leaf · ice = soft cool cyan-lilac · water = soft teal.
- Show ATK / shield / heal numbers only when given in the prompt — never invent combat math.

This batch: ONLY the two former-passive parts — eyes and ears — now as ACTIVE playable cards.
Match the frame language of the hero’s existing muzzle/headwear/back/tail attack cards.

Forbidden:
- Crypto / NFT / blockchain / wallets / mint badges / Axie class names / cloning known IP.
- Flat purple-on-white generic AI fantasy poster; soft-3D plastic; kid-garden pastel; gore; sexualized poses.
- Inventing new heroes, costs, or statuses beyond the prompt kit.
- English-only titles when RU names are provided.

Generate polished card art. Silhouette + cost gem + title must read at mobile thumbnail size.
```

---

## 4. Промпты по героям (eyes + ears)

### 4.1 Танк A «Щит-утёс» — `shop_tank_stone_a`

```
ATTACK CARDS — Mythfel / Мифиус — eyes+ears active pair.

Use master brief. Paint TWO battle-hand cards for the same hero (former passives → active). Match stone tank frame language.

HERO:
- name_ru: «Щит-утёс»
- role: Танк A (tank · hard-def)
- element: stone (soft warm grey-ochre)
- templateId: shop_tank_stone_a
- id_prefix: attack_shop_tank_stone_a

KIT (2 faces — eyes + ears only):
1) eyes — «Каменный взор» — cost gem 1 — self — shield 7 — art: glowing stone eyes; boulder barrier rising around the cat; chip «Щит»; shield value 7 readable; NO ATK.
2) ears — «Уши валуна» — cost gem 1 — ally — shield 5 (bonus if ally has taunt) — art: heavy stone ears listening; protective wall wrapping a taunting ally; chips «Щит» + «Таунт»; supportive, not DPS.

Composition rules:
- Pure defense utility; immovable hearthstone guardian mood.
- Russian titles. No crypto/NFT. No purple-on-white.

Output: 2 card plates. Filenames: attack_shop_tank_stone_a_{eyes|ears}.
```

### 4.2 Танк B «Пробой» — `shop_tank_stone_b`

```
ATTACK CARDS — Mythfel / Мифиус — eyes+ears active pair.

Use master brief. Paint TWO cards. Match Tank B cracked-stone / pierce frame language.

HERO:
- name_ru: «Пробой»
- role: Танк B (tank · pierce / fragile)
- element: stone
- templateId: shop_tank_stone_b
- id_prefix: attack_shop_tank_stone_b

KIT (2 faces):
1) eyes — «Трещина взора» — cost 1 — nearest — ATK 4 — pierce + fragile 1 — art: cracked glowing eyes; claw punch splitting a shield; chips «Пробой» + «Хрупкость».
2) ears — «Чуткость бреши» — cost 1 — nearest — ATK 5 pierce — art: alert stone ears sensing a gap in armor; spike thrust into shielded foe; chip «Пробой»; ATK 5 readable.

Composition rules:
- Cracks/shards identity vs Tank A boulder wall.
- Russian titles. No invented statuses beyond pierce/fragile.
- No crypto/NFT. No purple-on-white.

Output: 2 card plates. Filenames: attack_shop_tank_stone_b_{eyes|ears}.
```

### 4.3 Боец A «Парные когти» — `shop_fighter_fire_a`

```
ATTACK CARDS — Mythfel / Мифиус — eyes+ears active pair.

Use master brief. Paint TWO cards. Dual-wield fire fighter frame language.

HERO:
- name_ru: «Парные когти»
- role: Боец A (fighter · dual + crit · bleed cuts)
- element: fire (soft ember)
- templateId: shop_fighter_fire_a
- id_prefix: attack_shop_fighter_fire_a

KIT (2 faces):
1) eyes — «Искрящий взгляд» — cost 1 — nearest — ATK 3 × hits:2 · bleed 2 — art: sparking eyes; twin claw cuts leaving ember-blood trails; chips «×2» + «Порез».
2) ears — «Боевой слух» — cost 1 — nearest — ATK 4 crit · bleed 1 · ruffle — art: battle-tuned ears; sharp crit slash + fur ruffle; chips «Крит» + «Порез» + «Взъерошить».

Composition rules:
- Cuts/wounds fantasy (bleed), NOT stun/poison.
- Fast dual energy — not two-hand hammer poses.
- Russian titles. No crypto/NFT. No purple-on-white.

Output: 2 card plates. Filenames: attack_shop_fighter_fire_a_{eyes|ears}.
```

### 4.4 Боец B «Двуручный» — `shop_fighter_fire_b`

```
ATTACK CARDS — Mythfel / Мифиус — eyes+ears active pair.

Use master brief. Paint TWO cards. Heavy two-hand fighter frame language.

HERO:
- name_ru: «Двуручный»
- role: Боец B (fighter · two-hand · bleed / fragile wounds)
- element: fire
- templateId: shop_fighter_fire_b
- id_prefix: attack_shop_fighter_fire_b

KIT (2 faces):
1) eyes — «Яростный взор» — cost gem 2 — nearest — ATK 8 · bleed 2 — art: furious glowing eyes; heavy overhead cut that wounds deeply; chips «Порез»; cost gem clearly 2; ATK 8 large.
2) ears — «Рёв стали» — cost 1 — nearest — ATK 5 · fragile 1 · bleed 1 — art: roaring steel ears; crushing wound that cracks armor (увечье); chips «Увечье» + «Порез».

Composition rules:
- Heavy single swings; wounds/cuts — not dual hits:2.
- eyes is the only cost-2 in this pair.
- Russian titles. No crypto/NFT. No purple-on-white.

Output: 2 card plates. Filenames: attack_shop_fighter_fire_b_{eyes|ears}.
```

### 4.5 Ассасин A «Тень» — `shop_assassin_bolt_a`

```
ATTACK CARDS — Mythfel / Мифиус — eyes+ears active pair.

Use master brief. Paint TWO cards. Assassin A stealth/bolt frame language.

HERO:
- name_ru: «Тень»
- role: Ассасин A (assassin · stun + poison active tools)
- element: bolt (soft amber-gold on peat dark)
- templateId: shop_assassin_bolt_a
- id_prefix: attack_shop_assassin_bolt_a

KIT (2 faces):
1) eyes — «Глаза мглы» — cost 1 — nearest — ATK 3 · stun 1 — art: misty shadow eyes; foe locked mid-motion by a shadow pin; chips «Стан»; soft mist, not sci-fi.
2) ears — «Шёпот ветра» — cost 1 — nearest — ATK 4 · poison 2 — art: wind-whisper ears; venom needle spark of amber bolt; chips «Яд»; poison-green whisper accent allowed as tiny chip only.

Composition rules:
- This pair carries stun + poison for Assassin A (kit previously had stealth/crit only).
- Bolt = soft amber sparks, not neon cyber purple.
- Russian titles. No crypto/NFT. No purple-on-white.

Output: 2 card plates. Filenames: attack_shop_assassin_bolt_a_{eyes|ears}.
```

### 4.6 Ассасин B «Охотник тыла» — `shop_assassin_bolt_b`

```
ATTACK CARDS — Mythfel / Мифиус — eyes+ears active pair.

Use master brief. Paint TWO cards. ALL backline targeting. Assassin B frame language.

HERO:
- name_ru: «Охотник тыла»
- role: Ассасин B (assassin · backline · poison + stun)
- element: bolt
- templateId: shop_assassin_bolt_b
- id_prefix: attack_shop_assassin_bolt_b

KIT (2 faces — BOTH backline):
1) eyes — «Прицел в спину» — cost 1 — backline — ATK 4 crit · poison 2 — art: eyes locking onto rear support; venom dagger past the tank; chips «Тыл» + «Крит» + «Яд».
2) ears — «Слух поддержки» — cost 1 — backline — ATK 3 · stun 1 — art: ears tracking the healer/mage in the rear; quiet bolt stun pin; chips «Тыл» + «Стан».

Composition rules:
- Always show leaping past / ignoring frontline.
- Distinct from Assassin A (no self-stealth here; always backline).
- Russian titles. No crypto/NFT. No purple-on-white.

Output: 2 card plates. Filenames: attack_shop_assassin_bolt_b_{eyes|ears}.
```

### 4.7 Стрелок A «Охотник» — `shop_ranger_grass_a`

```
ATTACK CARDS — Mythfel / Мифиус — eyes+ears active pair.

Use master brief. Paint TWO cards. Ranger A hunter/grass frame language.

HERO:
- name_ru: «Охотник»
- role: Стрелок A (ranger · lowest_hp / ambush · weak + bleed)
- element: grass (soft leaf)
- templateId: shop_ranger_grass_a
- id_prefix: attack_shop_ranger_grass_a

KIT (2 faces — both cost 1):
1) eyes — «Глаз добычи» — cost 1 — lowest_hp — ATK 4 ambush · weak 1 — art: predator eye marking the weakest foe; leaf-fletched shot; chips «Слабый» + «Засада» + «Слабость».
2) ears — «Уши засады» — cost 1 — nearest — ATK 4 ambush · bleed 2 — art: ambush ears in brush; cutting arrow that opens a wound; chips «Засада» + «Порез».

Composition rules:
- Hunter marks / soft painted aim — not sci-fi HUD.
- NOT full-board arrow storms (Стрелок B).
- Russian titles. No crypto/NFT. No purple-on-white.

Output: 2 card plates. Filenames: attack_shop_ranger_grass_a_{eyes|ears}.
```

### 4.8 Стрелок B «Град стрел» — `shop_ranger_grass_b`

```
ATTACK CARDS — Mythfel / Мифиус — eyes+ears active pair.

Use master brief. Paint TWO cards. Ranger B AoE frame language.

HERO:
- name_ru: «Град стрел»
- role: Стрелок B (ranger · AoE suppress + bleed finish)
- element: grass
- templateId: shop_ranger_grass_b
- id_prefix: attack_shop_ranger_grass_b

KIT (2 faces):
1) eyes — «Широкий взор» — cost gem 2 — all_enemies — ATK 2 · weak 1 — art: wide eyes overseeing the board; suppressing volley raining soft weak on all foes; chips «AoE» + «Слабость»; cost 2 clear; modest ATK 2.
2) ears — «Дальний слух» — cost 1 — lowest_hp — ATK 4 · bleed 1 — art: long-range ears; single cutting arrow into the weakest; chips «Слабый» + «Порез»; only cost-1 face in the pair.

Composition rules:
- AoE must read multi-arrow; cost-2 gem unmistakable.
- Russian titles. No crypto/NFT. No purple-on-white.

Output: 2 card plates. Filenames: attack_shop_ranger_grass_b_{eyes|ears}.
```

### 4.9 Маг A «Огонь» — `shop_mage_fire_a`

```
ATTACK CARDS — Mythfel / Мифиус — eyes+ears active pair.

Use master brief. Paint TWO cards. Fire mage frame language.

HERO:
- name_ru: «Огонь»
- role: Маг A (mage · fire · vuln / weak)
- element: fire (soft ember — NOT neon magenta)
- templateId: shop_mage_fire_a
- id_prefix: attack_shop_mage_fire_a

KIT (2 faces):
1) eyes — «Пламенный зрачок» — cost 1 — nearest — ATK 4 · vuln 1 — art: ember pupil branding the main foe; chips «Уязвимость»; hearth flame, not toxic neon.
2) ears — «Треск искр» — cost 1 — nearest — ATK 3 crit · weak 1 — art: crackling spark ears; crit spark that saps strength; chips «Крит» + «Слабость».

Composition rules:
- Soft CC only — no stun on fire mage.
- Distinct from ice mage (no freeze crystals).
- Russian titles. No crypto/NFT. No purple-on-white.

Output: 2 card plates. Filenames: attack_shop_mage_fire_a_{eyes|ears}.
```

### 4.10 Маг B «Лёд» — `shop_mage_ice_b`

```
ATTACK CARDS — Mythfel / Мифиус — eyes+ears active pair.

Use master brief. Paint TWO cards. Ice mage frame language. CRITICAL: freeze/stun rules.

HERO:
- name_ru: «Лёд»
- role: Маг B (mage · ice control; second stun is COST 2)
- element: ice (soft cool cyan-lilac on dark peat — NOT purple-on-white flood)
- templateId: shop_mage_ice_b
- id_prefix: attack_shop_mage_ice_b

KIT (2 faces):
1) eyes — «Ледяной взор» — cost gem 2 — nearest — ATK 3 · stun 1 — art: freezing gaze locking ONE foe in ice; chip «Стан»; cost gem clearly 2; DO NOT show mass freeze.
2) ears — «Холодный слух» — cost 1 — nearest — ATK 3 · weak 2 — art: cold-listening ears; chilling aura that saps ATK hard; chip «Слабость»; NO stun on this card.

Composition rules:
- Only «Ледяной взор» in THIS pair may show stun; kit already has cost-1 «Морозный укус» — this eyes card is the expensive second stun.
- Soft ice cyan-lilac on dark wood — never generic AI purple poster.
- Russian titles. No crypto/NFT.

Output: 2 card plates. Filenames: attack_shop_mage_ice_b_{eyes|ears}.
```

### 4.11 Саппорт A «Чистый родник» — `shop_support_water_a`

```
ATTACK CARDS — Mythfel / Мифиус — eyes+ears active pair (heal/cleanse — no attack).

Use master brief. Paint TWO cards. Support A pure heal frame language.

HERO:
- name_ru: «Чистый родник»
- role: Саппорт A (support · heal + cleanse; NO attack)
- element: water (soft teal)
- templateId: shop_support_water_a
- id_prefix: attack_shop_support_water_a

KIT (2 faces — zero ATK):
1) eyes — «Целительный взгляд» — cost 1 — ally_lowest_hp — heal 6 — art: gentle glowing eyes over the most wounded ally; large heal 6; chip «Хил».
2) ears — «Уши очищения» — cost 1 — ally_lowest_hp — heal 3 · cleanse×2 — art: cleansing ears; clear water scrubbing TWO dark status wisps; chips «Хил» + «Очищение».

Composition rules:
- Warm tavern heal aesthetic — not hospital UI, not kindergarten bubbles.
- NO claws, NO enemy damage motifs.
- Russian titles. No crypto/NFT. No purple-on-white.

Output: 2 card plates. Filenames: attack_shop_support_water_a_{eyes|ears}.
```

### 4.12 Саппорт B «Прилив силы» — `shop_support_water_b`

```
ATTACK CARDS — Mythfel / Мифиус — eyes+ears active pair.

Use master brief. Paint TWO cards. Support B buff/weak frame language.

HERO:
- name_ru: «Прилив силы»
- role: Саппорт B (support · ATK buff + enemy weak)
- element: water (soft teal + warm lantern gold for buffs)
- templateId: shop_support_water_b
- id_prefix: attack_shop_support_water_b

KIT (2 faces):
1) eyes — «Вдохновляющий взор» — cost 1 — ally — ATK buff +2 for 3 turns — art: inspiring eyes; golden ripples empowering ally claws; chip «Бафф ATK»; no heal number required.
2) ears — «Шёпот слабости» — cost 1 — nearest — ATK 2 · weak 2 — art: whispering ears; soft water lash that heavily saps the front foe; chips «Слабость»; modest ATK 2.

Composition rules:
- Buff gold + heal/teal family; distinct from pure-cleanse Support A.
- No life drain / lifesteal (forbidden in battle).
- Russian titles. No crypto/NFT. No purple-on-white.

Output: 2 card plates. Filenames: attack_shop_support_water_b_{eyes|ears}.
```

---

## 5. Checklist после генерации

| # | Hero RU | templateId | Новые карты |
|---|---|---|---|
| 1 | Щит-утёс | `shop_tank_stone_a` | Каменный взор · Уши валуна |
| 2 | Пробой | `shop_tank_stone_b` | Трещина взора · Чуткость бреши |
| 3 | Парные когти | `shop_fighter_fire_a` | Искрящий взгляд · Боевой слух |
| 4 | Двуручный | `shop_fighter_fire_b` | Яростный взор · Рёв стали |
| 5 | Тень | `shop_assassin_bolt_a` | Глаза мглы · Шёпот ветра |
| 6 | Охотник тыла | `shop_assassin_bolt_b` | Прицел в спину · Слух поддержки |
| 7 | Охотник | `shop_ranger_grass_a` | Глаз добычи · Уши засады |
| 8 | Град стрел | `shop_ranger_grass_b` | Широкий взор · Дальний слух |
| 9 | Огонь | `shop_mage_fire_a` | Пламенный зрачок · Треск искр |
| 10 | Лёд | `shop_mage_ice_b` | Ледяной взор · Холодный слух |
| 11 | Чистый родник | `shop_support_water_a` | Целительный взгляд · Уши очищения |
| 12 | Прилив силы | `shop_support_water_b` | Вдохновляющий взор · Шёпот слабости |

**Итого к генерации:** 24 card faces.  
**Уже есть:** 48 faces из `stitch-prompts-attack-cards-12-heroes.md`.  
**Полный кит после апрува:** 72 faces (12×6).

---

## 6. SSOT follow-ups (после апрува Andrew)

Не делать до явного OK:

1. Патч `FULL-SPEC.md` §1 / §2.3 / §5.1: N=6; `eyes`/`ears` → cardId.  
2. Wiki §1: убрать колонку «пассив», вписать 6 карт.  
3. `content/cards/shop_*_{eyes,ears}.json` + i18n.  
4. Mythic nursery: пул 12 → N=6.  
5. Sim / web-hud hand: колода 1×6 на кота.  
6. Обновить `card-count-axie.md` (рекомендация N=4 → SUPERSEDED).

---

## Sources

- Кит 4 карт + имена: `docs/stitch-prompts-attack-cards-12-heroes.md`, `docs/game-wiki.md` §1  
- Роли/варианты: `docs/class-variants-balance.md`  
- Стиль: `docs/stitch-prompt.md`, `client/web-hud/design/DESIGN.md`  
- Статусы MVP: `stun`, `poison`, `bleed`, `weak`, `vuln`, `fragile`, `taunt`, `stealth`, `ruffle`, `cleanse`
