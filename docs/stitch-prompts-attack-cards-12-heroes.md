# Stitch prompts — карты атак 12 soft-launch героев (Мифиус)

Готовые **12 отдельных промптов** для Google Stitch: арт **карт атак** (карты руки в battle HUD), не UI-экранов.  
SSOT: `docs/game-wiki.md` §1 · `docs/class-variants-balance.md` · `content/cards/shop_*.json` · `content/i18n/ru_en.json`.  
Стиль: **Tavern Hearth Battler** (`docs/stitch-prompt-gear-sets.md`, `client/web-hud/design/DESIGN.md`) + battle-card clarity из `docs/stitch-prompt.md` §2.

**Только арт карт.** Не выдумывать новых героев, карт, стоимостей или статусов. Числа ATK/shield/heal на рамке — только из кита ниже.

---

## How to paste into Stitch

1. В новой Stitch-сессии Mythfel вставь **§0 Master art brief** один раз.  
2. Дальше — **один промпт героя за раз** (§1…§12): копируй блок в \`\`\` целиком.  
3. Если дрейф стиля: *«Keep Tavern Hearth Battler cozy dark fantasy; painted 2D attack cards for battle HUD hand; soft element tint only; Russian titles; no crypto, no kindergarten, no purple-on-white AI poster.»*  
4. Каждый промпт просит **набор из 4 card faces** одного героя (единый frame language, разные иллюстрации). При лимите Stitch на 1 кадр — генерируй по одной карте, сохраняя тот же frame/cost gem.

### Export naming

| Что | Паттерн | Пример |
|---|---|---|
| Одна карта | `attack_{templateId}_{part}` | `attack_shop_tank_stone_a_muzzle` |
| Пакет героя (zip/folder) | `attackkit_{templateId}` | `attackkit_shop_mage_ice_b` |
| Hero slug (файл промпта / batch) | `hero_{n}_{slug}` | `hero_01_tank_a_shield_utes` |

`part` ∈ `muzzle` | `headwear` | `back` | `tail` (N=4 kit, FULL-SPEC §2.3).

---

## 0. Master art brief (вставить первым)

```
Asset art for «Мифиус: Мифические котики» (Mythfel) — ATTACK / SKILL CARDS for the battle HUD hand.
Not full app screens. Not gear/armor cards. Not shop cat portraits as the main deliverable.

Product / style:
- Turn-based 3v3 card battler with combat mythic cats (боевые мифики).
- Art direction: «Tavern Hearth Battler» — cozy dark fantasy tavern: peat charcoal canvas (#161310 / #14110F), aged hearthstone / carved wood card frames, bronze clasps, warm lantern / amber-gold light (#D99B26 / #fdba45), aged vellum (#F4E8D1) for title plaque.
- Classic early Axie Infinity vibe as HAND-CARD clarity ONLY: painted / illustrated 2D, warm fairy-tale combat — NOT late soft-3D Axie, NOT crypto/NFT chrome, NOT kindergarten cute.
- Mood: hearthside spellbook / tavern battle — storybook craft, casual-cool power fantasy, still cozy.

Card format (mobile battle HUD):
- Vertical collectible skill card, portrait ~2:3, rounded-lg game card, readable at thumbnail in a 4-card hand.
- Layout per card: (1) top-left COST GEM (amber/gold circle with energy cost 1 or 2, large), (2) center painted scene of the effect (cat paws / claws / spells / arrows — clearly cats, not Axie blobs), (3) bottom title plaque with RU card name, (4) optional tiny chips for target/status (Щит, Таунт, Крит, Яд, Стан…).
- Soft element frame tint ONLY as a thin accent (not neon): stone = warm grey-ochre · fire = soft ember · bolt = soft amber-gold · grass = soft leaf · ice = soft cool cyan-lilac · water = soft teal.
- Show ATK / shield / heal numbers only when given in the prompt parameters — never invent combat math.

Forbidden:
- Crypto / NFT / blockchain / wallets / mint badges / Axie class names / cloning known IP.
- Flat purple-on-white generic AI fantasy poster look; soft-3D plastic renders; kid-garden pastel toys; gore; sexualized poses.
- Inventing new heroes, cards, costs, or statuses beyond the prompt kit.
- English-only titles when RU names are provided — Russian labels on the card face.

Generate polished card art. Silhouette + cost gem + title must read at mobile thumbnail size.
```

---

## 1. Танк A «Щит-утёс» — `shop_tank_stone_a`

**Роль / стиль:** tank · hard-def · element **stone**  
**Пассивы (wiki, не карты):** Каменный взор · Уши валуна  
**Покрывает:** полный кит 4 карт (единый stone-frame set)

| Part | RU title | cost | target | numbers / tags |
|---|---|---|---|---|
| muzzle | Каменный оскал | 1 | self | shield 8 · `taunt` 2 |
| headwear | Галька-шлем | 1 | self | shield 10 |
| back | Щит-валун | 1 | self | shield 9 · taunt tag |
| tail | Хвост-утёс | 1 | nearest | atk 4 · taunt tag (weak poke) |

```
ATTACK CARDS — Mythfel / Мифиус — hero kit set.

Use master brief. Paint ONE coherent set of 4 battle-hand cards for the same hero.

HERO:
- name_ru: «Щит-утёс»
- role: Танк A (tank · hard-def)
- element: stone (soft warm grey-ochre frame accent)
- templateId: shop_tank_stone_a
- id_prefix: attack_shop_tank_stone_a

KIT (4 faces — same wood/bronze frame language, different art):
1) muzzle — «Каменный оскал» — cost gem 1 — self shield+taunt — art: combat mythic cat snarling behind a rising stone shield wall; chip «Таунт»; shield value 8 readable.
2) headwear — «Галька-шлем» — cost gem 1 — self big shield — art: pebble/stone helm and boulder barrier; shield value 10; no taunt chip.
3) back — «Щит-валун» — cost gem 1 — self shield+taunt feel — art: massive boulder-guard plate on the cat’s back; shield 9; chip «Щит».
4) tail — «Хвост-утёс» — cost gem 1 — nearest poke atk 4 — art: cliff-tail slam into the front enemy; modest ATK 4; still tank silhouette, not a DPS flex.

Composition rules:
- Vertical ~2:3 HUD cards; cost gem top-left; RU title plaque bottom; mobile-readable.
- Mood: immovable hearthstone guardian — high shield, soft poke only on tail.
- No crypto/NFT. No purple-on-white. Cats must look like cats.

Output: 4 card art plates (or one sheet with 4 labeled cards). Filenames: attack_shop_tank_stone_a_{muzzle|headwear|back|tail}.
```

---

## 2. Танк B «Пробой» — `shop_tank_stone_b`

**Роль / стиль:** tank · pierce · element **stone**  
**Пассивы:** Трещина взора · Чуткость бреши  
**Покрывает:** полный кит 4 карт

| Part | RU title | cost | target | numbers / tags |
|---|---|---|---|---|
| muzzle | Пробой когтем | 1 | nearest | atk 5 · `pierce` · `fragile` 2 |
| headwear | Щит-осколок | 1 | self | shield 6 · `taunt` 2 |
| back | Бронелом | 1 | nearest | atk 6 · `pierce` |
| tail | Хвост-пробой | 2 | backline | atk 5 · pierce · `fragile` 1 |

```
ATTACK CARDS — Mythfel / Мифиус — hero kit set.

Use master brief. Paint ONE coherent set of 4 battle-hand cards for the same hero.

HERO:
- name_ru: «Пробой»
- role: Танк B (tank · pierce / fragile)
- element: stone (soft warm grey-ochre + cracked-armor accents)
- templateId: shop_tank_stone_b
- id_prefix: attack_shop_tank_stone_b

KIT (4 faces):
1) muzzle — «Пробой когтем» — cost 1 — nearest — ATK 5 — art: stone claw punching through a glowing shield; chips «Пробой» + «Хрупкость»; pierce/fragile readable.
2) headwear — «Щит-осколок» — cost 1 — self — shield 6 + taunt 2 — art: jagged shard-shield; lighter defense than Щит-утёс; chip «Таунт».
3) back — «Бронелом» — cost 1 — nearest — ATK 6 pierce — art: armored cat shoulder-check cracking enemy plate; chip «Пробой».
4) tail — «Хвост-пробой» — cost gem 2 — backline — ATK 5 pierce + fragile 1 — art: tail spike thrusting past the frontline into rear support; chip «Тыл»; cost gem clearly 2.

Composition rules:
- Same Tavern Hearth card chrome as other Mythfel attack cards; stone element tint.
- Visual identity vs Tank A: cracks, shards, pierce lines — not pure boulder wall.
- Russian titles. No invented statuses beyond pierce/fragile/taunt/shield.
- No crypto/NFT. No purple-on-white.

Output: 4 card plates. Filenames: attack_shop_tank_stone_b_{muzzle|headwear|back|tail}.
```

---

## 3. Боец A «Парные когти» — `shop_fighter_fire_a`

**Роль / стиль:** fighter · dual+crit · element **fire**  
**Пассивы:** Искрящий взгляд · Боевой слух  
**Покрывает:** полный кит 4 карт

| Part | RU title | cost | target | numbers / tags |
|---|---|---|---|---|
| muzzle | Парный укус | 1 | nearest | atk 3 · hits:2 · ruffle · crit |
| headwear | Искры-когти | 1 | nearest | atk 3 · hits:2 · `ruffle`×1 |
| back | Критовсечь | 1 | nearest | atk 4 · crit · ruffle |
| tail | Двойной хлыст | 2 | backline | atk 3 · hits:2 · crit · backline |

```
ATTACK CARDS — Mythfel / Мифиус — hero kit set.

Use master brief. Paint ONE coherent set of 4 battle-hand cards for the same hero.

HERO:
- name_ru: «Парные когти»
- role: Боец A (fighter · dual wield + crit)
- element: fire (soft ember red-orange accent)
- templateId: shop_fighter_fire_a
- id_prefix: attack_shop_fighter_fire_a

KIT (4 faces):
1) muzzle — «Парный укус» — cost 1 — nearest — ATK 3 × hits:2 — art: twin flaming bite/claw marks; chips «×2» + «Крит»; dual-wield silhouette.
2) headwear — «Искры-когти» — cost 1 — nearest — ATK 3 ×2 + ruffle — art: sparking claw flurry kicking up ember fur (ruffle/claw tension); chip «Взъерошить».
3) back — «Критовсечь» — cost 1 — nearest — ATK 4 crit — art: single sharp crit slash with ember trail; chip «Крит».
4) tail — «Двойной хлыст» — cost gem 2 — backline — ATK 3 ×2 — art: twin fiery tail lashes leaping over frontline into rear; chips «Тыл» + «×2»; cost clearly 2.

Composition rules:
- Fast dual-wield energy; NOT two-hand hammer poses (that’s Боец B).
- Soft fire element, warm tavern light — not neon lava posters.
- Russian titles. Mobile-readable cost gem + title.
- No crypto/NFT. No purple-on-white.

Output: 4 card plates. Filenames: attack_shop_fighter_fire_a_{muzzle|headwear|back|tail}.
```

---

## 4. Боец B «Двуручный» — `shop_fighter_fire_b`

**Роль / стиль:** fighter · two-hand · element **fire**  
**Пассивы:** Яростный взор · Рёв стали  
**Покрывает:** полный кит 4 карт

| Part | RU title | cost | target | numbers / tags |
|---|---|---|---|---|
| muzzle | Двуручный удар | 2 | nearest | atk 9 · ruffle |
| headwear | Тяжёлый оскал | 1 | nearest | atk 7 · `ruffle`×2 |
| back | Молот жара | 2 | nearest | atk 11 |
| tail | Тяжёлый хлыст | 2 | backline | atk 8 · ruffle · backline |

```
ATTACK CARDS — Mythfel / Мифиус — hero kit set.

Use master brief. Paint ONE coherent set of 4 battle-hand cards for the same hero.

HERO:
- name_ru: «Двуручный»
- role: Боец B (fighter · two-hand heavy)
- element: fire (soft ember accent)
- templateId: shop_fighter_fire_b
- id_prefix: attack_shop_fighter_fire_b

KIT (4 faces):
1) muzzle — «Двуручный удар» — cost gem 2 — nearest — ATK 9 — art: both paws on one heavy heated blade/club smash; weighty impact; chip optional «Тяжёлый».
2) headwear — «Тяжёлый оскал» — cost 1 — nearest — ATK 7 + ruffle×2 — art: fierce snarl, heavy overhead prep; chip «Взъерошить»; only cost-1 in this kit.
3) back — «Молот жара» — cost gem 2 — nearest — ATK 11 — art: signature heat-hammer slam, biggest single hit of the kit; ATK 11 large and readable.
4) tail — «Тяжёлый хлыст» — cost gem 2 — backline — ATK 8 — art: massive fiery tail smash into rear line; chip «Тыл».

Composition rules:
- Heavy single swings (atk 7–11), NOT dual hits:2 poses.
- Cost gems mostly 2 — make the “2” gem unmistakable vs Fighter A.
- Russian titles. No crypto/NFT. No purple-on-white.

Output: 4 card plates. Filenames: attack_shop_fighter_fire_b_{muzzle|headwear|back|tail}.
```

---

## 5. Ассасин A «Тень» — `shop_assassin_bolt_a`

**Роль / стиль:** assassin · stealth+crit · element **bolt**  
**Пассивы:** Глаза мглы · Шёпот ветра  
**Покрывает:** полный кит 4 карт

| Part | RU title | cost | target | numbers / tags |
|---|---|---|---|---|
| muzzle | Теневой укус | 1 | nearest | atk 5 · crit |
| headwear | Ускользнуть | 1 | self | `stealth` 1 (no atk) |
| back | Крит из тени | 1 | nearest | atk 6 · crit |
| tail | Исчезновение | 2 | nearest | atk 5 · crit · apply `stealth` 1 |

```
ATTACK CARDS — Mythfel / Мифиус — hero kit set.

Use master brief. Paint ONE coherent set of 4 battle-hand cards for the same hero.

HERO:
- name_ru: «Тень»
- role: Ассасин A (assassin · stealth + crit)
- element: bolt (soft amber-gold lightning accent on peat dark)
- templateId: shop_assassin_bolt_a
- id_prefix: attack_shop_assassin_bolt_a

KIT (4 faces):
1) muzzle — «Теневой укус» — cost 1 — nearest — ATK 5 crit — art: shadow-cat bite with amber bolt spark; chip «Крит».
2) headwear — «Ускользнуть» — cost 1 — self — stealth only — art: cat dissolving into mist/shadow cloak; NO ATK number; chip «Стелс»; utility card face clearly different from strikes.
3) back — «Крит из тени» — cost 1 — nearest — ATK 6 crit — art: strike erupting from darkness; strongest plain crit in kit.
4) tail — «Исчезновение» — cost gem 2 — nearest — ATK 5 crit + gain stealth — art: hit then vanish; chips «Крит» + «Стелс»; cost 2.

Composition rules:
- Stealth = soft mist/shadow, not sci-fi cloaking HUD.
- Bolt element = soft amber sparks, not neon cyber purple.
- Russian titles. No poison on this variant (poison is Assassin B passive fantasy).
- No crypto/NFT. No purple-on-white.

Output: 4 card plates. Filenames: attack_shop_assassin_bolt_a_{muzzle|headwear|back|tail}.
```

---

## 6. Ассасин B «Охотник тыла» — `shop_assassin_bolt_b`

**Роль / стиль:** assassin · backline · element **bolt**  
**Пассивы:** Прицел в спину (+`poison` 2 на backline-удар) · Слух поддержки  
**Покрывает:** полный кит 4 карт (все `backline`)

| Part | RU title | cost | target | numbers / tags |
|---|---|---|---|---|
| muzzle | Укол в тыл | 1 | backline | atk 5 · crit |
| headwear | Тихий разряд | 1 | backline | atk 4 · crit |
| back | Пронзить тыл | 1 | backline | atk 6 |
| tail | Казнь сзади | 2 | backline | atk 7 · crit |

```
ATTACK CARDS — Mythfel / Мифиус — hero kit set.

Use master brief. Paint ONE coherent set of 4 battle-hand cards for the same hero.

HERO:
- name_ru: «Охотник тыла»
- role: Ассасин B (assassin · all backline + crit; support hunter)
- element: bolt (soft amber-gold)
- templateId: shop_assassin_bolt_b
- id_prefix: attack_shop_assassin_bolt_b
- passive_note (art flavor only, eyes passive): backline hits may show a soft poison-green whisper — do not invent a separate poison cost/number on the frame unless as a tiny «Яд» chip tied to the passive fantasy.

KIT (4 faces — EVERY card targets backline):
1) muzzle — «Укол в тыл» — cost 1 — backline — ATK 5 crit — art: dagger/claw past the front tank into rear support; chips «Тыл» + «Крит».
2) headwear — «Тихий разряд» — cost 1 — backline — ATK 4 crit — art: quiet bolt needle to the backline; stealthy, not loud AoE.
3) back — «Пронзить тыл» — cost 1 — backline — ATK 6 — art: clean pierce through rear rank; chip «Тыл».
4) tail — «Казнь сзади» — cost gem 2 — backline — ATK 7 crit — art: signature rear execute, strongest hit; chips «Тыл» + «Крит»; cost 2.

Composition rules:
- Always show leaping past / ignoring the frontline — backline fantasy must be obvious at thumbnail.
- Distinct from Assassin A (no self-stealth utility card here).
- Russian titles. No crypto/NFT. No purple-on-white.

Output: 4 card plates. Filenames: attack_shop_assassin_bolt_b_{muzzle|headwear|back|tail}.
```

---

## 7. Стрелок A «Охотник» — `shop_ranger_grass_a`

**Роль / стиль:** ranger · lowest_hp / ambush · element **grass**  
**Пассивы:** Глаз добычи · Уши засады  
**Покрывает:** полный кит 4 карт

| Part | RU title | cost | target | numbers / tags |
|---|---|---|---|---|
| muzzle | Метка охотника | 1 | lowest_hp | atk 6 · ambush · crit |
| headwear | Прицельный укус | 1 | lowest_hp | atk 5 · ambush |
| back | Стрела в тыл | 1 | backline | atk 5 |
| tail | Крит-засада | 1 | nearest | atk 6 · ambush · crit |

```
ATTACK CARDS — Mythfel / Мифиус — hero kit set.

Use master brief. Paint ONE coherent set of 4 battle-hand cards for the same hero.

HERO:
- name_ru: «Охотник»
- role: Стрелок A (ranger · lowest_hp hunter + ambush/crit)
- element: grass (soft leaf green accent)
- templateId: shop_ranger_grass_a
- id_prefix: attack_shop_ranger_grass_a

KIT (4 faces — all cost 1):
1) muzzle — «Метка охотника» — cost 1 — lowest_hp — ATK 6 crit — art: glowing hunter’s mark over the weakest foe; leaf-fletched arrow; chips «Слабый» + «Крит».
2) headwear — «Прицельный укус» — cost 1 — lowest_hp — ATK 5 ambush — art: careful aimed shot/bite at wounded prey; chip «Засада».
3) back — «Стрела в тыл» — cost 1 — backline — ATK 5 — art: arrow arcing into rear line; chip «Тыл».
4) tail — «Крит-засада» — cost 1 — nearest — ATK 6 crit ambush — art: ambush crit from brush toward front foe; chips «Засада» + «Крит».

Composition rules:
- Any-target hunter fantasy (marks, aim reticles soft/painted — not sci-fi HUD chrome).
- NOT full-board arrow storms (that’s Стрелок B).
- Soft grass element. Russian titles. All cost gems = 1.
- No crypto/NFT. No purple-on-white.

Output: 4 card plates. Filenames: attack_shop_ranger_grass_a_{muzzle|headwear|back|tail}.
```

---

## 8. Стрелок B «Град стрел» — `shop_ranger_grass_b`

**Роль / стиль:** ranger · AoE · element **grass**  
**Пассивы:** Широкий взор · Дальний слух  
**Покрывает:** полный кит 4 карт

| Part | RU title | cost | target | numbers / tags |
|---|---|---|---|---|
| muzzle | Град стрел | 2 | all_enemies | atk 4 · aoe · ambush |
| headwear | Тяжёлые стрелы | 2 | all_enemies | atk 3 · aoe |
| back | Метка слабого | 1 | lowest_hp | atk 5 · ambush |
| tail | Залп по площади | 2 | all_enemies | atk 4 · aoe · ambush · backline tag |

```
ATTACK CARDS — Mythfel / Мифиус — hero kit set.

Use master brief. Paint ONE coherent set of 4 battle-hand cards for the same hero.

HERO:
- name_ru: «Град стрел»
- role: Стрелок B (ranger · heavy AoE arrows, cost 2)
- element: grass (soft leaf green)
- templateId: shop_ranger_grass_b
- id_prefix: attack_shop_ranger_grass_b

KIT (4 faces):
1) muzzle — «Град стрел» — cost gem 2 — all_enemies — ATK 4 — art: signature arrow storm raining on the whole enemy board; chip «AoE» / «Все враги»; cost 2 clear.
2) headwear — «Тяжёлые стрелы» — cost gem 2 — all_enemies — ATK 3 — art: thicker heavier volley, slower pressure; chip «AoE».
3) back — «Метка слабого» — cost 1 — lowest_hp — ATK 5 — art: single mark shot on the weakest (the kit’s only cheap single); chip «Слабый»; only cost-1 face.
4) tail — «Залп по площади» — cost gem 2 — all_enemies — ATK 4 — art: wide volley emphasizing depth/backline splash; chips «AoE» + optional «Тыл».

Composition rules:
- AoE must read as multi-arrow / multi-target — not a single hunter mark.
- Cost-2 gems dominate; do not make AoE look spam-cheap.
- Soft grass, tavern warmth. Russian titles.
- No crypto/NFT. No purple-on-white.

Output: 4 card plates. Filenames: attack_shop_ranger_grass_b_{muzzle|headwear|back|tail}.
```

---

## 9. Маг A «Огонь» — `shop_mage_fire_a`

**Роль / стиль:** mage · fire AoE · element **fire**  
**Пассивы:** Пламенный зрачок (`vuln` на главной в AoE) · Треск искр (`weak` с крит-карты)  
**Покрывает:** полный кит 4 карт

| Part | RU title | cost | target | numbers / tags |
|---|---|---|---|---|
| muzzle | Огненный круг | 2 | all_enemies | atk 3 · aoe · `weak` 1 · crit |
| headwear | Искра-крит | 1 | nearest | atk 4 · crit · control |
| back | Волна жара | 2 | all_enemies | atk 3 · aoe · crit |
| tail | Ожог тыла | 1 | backline | atk 5 · `vuln` 1 |

```
ATTACK CARDS — Mythfel / Мифиус — hero kit set.

Use master brief. Paint ONE coherent set of 4 battle-hand cards for the same hero.

HERO:
- name_ru: «Огонь»
- role: Маг A (mage · fire AoE + crit + weak/vuln)
- element: fire (soft ember)
- templateId: shop_mage_fire_a
- id_prefix: attack_shop_mage_fire_a

KIT (4 faces):
1) muzzle — «Огненный круг» — cost gem 2 — all_enemies — ATK 3 + weak 1 — art: ring of hearth-fire around enemy board; chips «AoE» + «Слабость»; crit-capable sparks.
2) headwear — «Искра-крит» — cost 1 — nearest — ATK 4 crit — art: focused spark bolt to front foe; chip «Крит»; single-target, not AoE.
3) back — «Волна жара» — cost gem 2 — all_enemies — ATK 3 crit — art: rolling heat wave across all enemies; chip «AoE».
4) tail — «Ожог тыла» — cost 1 — backline — ATK 5 + vuln 1 — art: ember lash branding the rear; chips «Тыл» + «Уязвимость».

Composition rules:
- Fire mage = painted ember/hearth flame, NOT toxic neon magenta fire.
- Distinct from ice mage (no freeze crystals here).
- Russian titles. Show weak/vuln as small RU status chips only.
- No crypto/NFT. No purple-on-white.

Output: 4 card plates. Filenames: attack_shop_mage_fire_a_{muzzle|headwear|back|tail}.
```

---

## 10. Маг B «Лёд» — `shop_mage_ice_b`

**Роль / стиль:** mage · ice control · element **ice**  
**Пассивы:** Ледяной взор (single → `stun` 1) · Холодный слух  
**Покрывает:** полный кит 4 карт  
**Важно:** freeze = **stun 1 на одиночной цели**, не mass AoE freeze (class-variants SSOT).

| Part | RU title | cost | target | numbers / tags |
|---|---|---|---|---|
| muzzle | Ледяная буря | 2 | all_enemies | atk 3 · aoe · control |
| headwear | Морозный укус | 1 | nearest | atk 4 · `stun` 1 |
| back | Холодный фронт | 2 | all_enemies | atk 3 · aoe · control |
| tail | Заморозка тыла | 2 | backline | atk 4 · `weak` 1 |

```
ATTACK CARDS — Mythfel / Мифиус — hero kit set.

Use master brief. Paint ONE coherent set of 4 battle-hand cards for the same hero.

HERO:
- name_ru: «Лёд»
- role: Маг B (mage · ice control; freeze = stun 1 on SINGLE target only)
- element: ice (soft cool cyan-lilac accent on dark peat — NOT purple-on-white flood)
- templateId: shop_mage_ice_b
- id_prefix: attack_shop_mage_ice_b

KIT (4 faces):
1) muzzle — «Ледяная буря» — cost gem 2 — all_enemies — ATK 3 — art: icy wind/storm over the board for damage pressure; chip «AoE»; DO NOT show mass freeze/stun on all enemies.
2) headwear — «Морозный укус» — cost 1 — nearest — ATK 4 + stun 1 — art: THE freeze card — single foe locked in ice crystal; chip «Стан» / «Заморозка»; only stun applicator in the kit.
3) back — «Холодный фронт» — cost gem 2 — all_enemies — ATK 3 — art: cold front wave, control mood without mass stun; chip «AoE».
4) tail — «Заморозка тыла» — cost gem 2 — backline — ATK 4 + weak 1 — art: chilling the rear support; chips «Тыл» + «Слабость» (weak, not stun).

Composition rules:
- Critical rules fidelity: only «Морозный укус» may show stun/freeze lock.
- Soft ice cyan-lilac on dark wood frame — never generic AI purple poster.
- Russian titles. No crypto/NFT.

Output: 4 card plates. Filenames: attack_shop_mage_ice_b_{muzzle|headwear|back|tail}.
```

---

## 11. Саппорт A «Чистый родник» — `shop_support_water_a`

**Роль / стиль:** support · heal/cleanse · element **water** · **без атаки**  
**Пассивы:** Целительный взгляд · Уши очищения  
**Покрывает:** полный кит 4 карт

| Part | RU title | cost | target | numbers / tags |
|---|---|---|---|---|
| muzzle | Капля жизни | 1 | ally_lowest_hp | heal 5 |
| headwear | Чистый родник | 1 | ally_lowest_hp | heal 4 · `cleanse` |
| back | Волна опеки | 2 | ally_all | heal 3 |
| tail | Очищение | 1 | ally_lowest_hp | heal 4 · `cleanse` |

```
ATTACK CARDS — Mythfel / Мифиус — hero kit set (heal/cleanse — no attack faces).

Use master brief. Paint ONE coherent set of 4 battle-hand cards for the same hero.

HERO:
- name_ru: «Чистый родник»
- role: Саппорт A (support · pure heal + cleanse; NO attack)
- element: water (soft teal-blue)
- templateId: shop_support_water_a
- id_prefix: attack_shop_support_water_a

KIT (4 faces — all support, zero ATK):
1) muzzle — «Капля жизни» — cost 1 — ally_lowest_hp — heal 5 — art: single glowing water drop over the most wounded ally cat; large heal number 5; chip «Хил».
2) headwear — «Чистый родник» — cost 1 — ally_lowest_hp — heal 4 + cleanse — art: spring fountain washing dark status wisps away; chips «Хил» + «Очищение».
3) back — «Волна опеки» — cost gem 2 — ally_all — heal 3 — art: gentle tide covering all three allies; chip «Союзники»; cost 2.
4) tail — «Очищение» — cost 1 — ally_lowest_hp — heal 4 + cleanse — art: tail brush of clear water scrubbing poison/bleed motes; chips «Хил» + «Очищение».

Composition rules:
- Warm tavern heal aesthetic (milk-teal water), combat-world — not hospital UI, not kindergarten soap bubbles.
- NO claws, NO enemy damage motifs on this kit.
- Russian titles. No crypto/NFT. No purple-on-white.

Output: 4 card plates. Filenames: attack_shop_support_water_a_{muzzle|headwear|back|tail}.
```

---

## 12. Саппорт B «Прилив силы» — `shop_support_water_b`

**Роль / стиль:** support · heal/buff + enemy `weak` · element **water**  
**Пассивы:** Вдохновляющий взор · Шёпот слабости  
**Покрывает:** полный кит 4 карт

| Part | RU title | cost | target | numbers / tags |
|---|---|---|---|---|
| muzzle | Лёгкий хил | 1 | ally_lowest_hp | heal 4 |
| headwear | Боевой настрой | 1 | ally_lowest_hp | ATK buff +2 for 2 |
| back | Прилив силы | 2 | ally_all | heal 3 · shield 2 · ATK buff +1 (1) |
| tail | Ослабить врага | 1 | nearest | atk 3 · `weak` 1 |

```
ATTACK CARDS — Mythfel / Мифиус — hero kit set.

Use master brief. Paint ONE coherent set of 4 battle-hand cards for the same hero.

HERO:
- name_ru: «Прилив силы»
- role: Саппорт B (support · heal + ATK buff + enemy weak)
- element: water (soft teal with warm lantern gold for buffs)
- templateId: shop_support_water_b
- id_prefix: attack_shop_support_water_b

KIT (4 faces):
1) muzzle — «Лёгкий хил» — cost 1 — ally_lowest_hp — heal 4 — art: soft tide heal on wounded ally; chip «Хил».
2) headwear — «Боевой настрой» — cost 1 — ally_lowest_hp — ATK buff +2 (2 turns) — art: rallying roar/cheer aura, golden ripples on ally claws; chip «Бафф ATK»; no heal number required.
3) back — «Прилив силы» — cost gem 2 — ally_all — heal 3 + shield 2 + small ATK buff — art: signature rising tide empowering the whole trio; chips «Хил» + «Щит» + «Бафф»; cost 2.
4) tail — «Ослабить врага» — cost 1 — nearest — ATK 3 + weak 1 — art: the kit’s only offensive face — water lash that saps the front foe; chips «Атака» + «Слабость»; ATK 3 readable.

Composition rules:
- Buff gold + heal teal; clearly different from pure-cleanse Support A (has buff + one weak attack).
- Russian titles. No invented drain/lifesteal (wiki: life drain in battle forbidden).
- No crypto/NFT. No purple-on-white.

Output: 4 card plates. Filenames: attack_shop_support_water_b_{muzzle|headwear|back|tail}.
```

---

## Sources / checklist

| # | Hero RU | templateId | Cards (RU) |
|---|---|---|---|
| 1 | Щит-утёс | `shop_tank_stone_a` | Каменный оскал · Галька-шлем · Щит-валун · Хвост-утёс |
| 2 | Пробой | `shop_tank_stone_b` | Пробой когтем · Щит-осколок · Бронелом · Хвост-пробой |
| 3 | Парные когти | `shop_fighter_fire_a` | Парный укус · Искры-когти · Критовсечь · Двойной хлыст |
| 4 | Двуручный | `shop_fighter_fire_b` | Двуручный удар · Тяжёлый оскал · Молот жара · Тяжёлый хлыст |
| 5 | Тень | `shop_assassin_bolt_a` | Теневой укус · Ускользнуть · Крит из тени · Исчезновение |
| 6 | Охотник тыла | `shop_assassin_bolt_b` | Укол в тыл · Тихий разряд · Пронзить тыл · Казнь сзади |
| 7 | Охотник | `shop_ranger_grass_a` | Метка охотника · Прицельный укус · Стрела в тыл · Крит-засада |
| 8 | Град стрел | `shop_ranger_grass_b` | Град стрел · Тяжёлые стрелы · Метка слабого · Залп по площади |
| 9 | Огонь | `shop_mage_fire_a` | Огненный круг · Искра-крит · Волна жара · Ожог тыла |
| 10 | Лёд | `shop_mage_ice_b` | Ледяная буря · Морозный укус · Холодный фронт · Заморозка тыла |
| 11 | Чистый родник | `shop_support_water_a` | Капля жизни · Чистый родник · Волна опеки · Очищение |
| 12 | Прилив силы | `shop_support_water_b` | Лёгкий хил · Боевой настрой · Прилив силы · Ослабить врага |

Card names/costs/targets synced from `content/cards/shop_*.json` + `content/i18n/ru_en.json` (shop keys). Hero display names from `docs/game-wiki.md` §1.1.
