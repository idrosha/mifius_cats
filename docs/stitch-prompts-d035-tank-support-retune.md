# Stitch prompts — D-035 tank/support late-finish retune (17 карт)

**Цель:** перерисовать **только** карты, у которых playable числа ушли от арта после `D-035`.  
Подмена файлов 1:1 — те же `attack_shop_*_{part}.webp` / `.png` пути.

**Не трогать:** fighter / assassin / ranger / mage; карты танков/саппортов **без** строк в таблице ниже (например muzzle Танк A, ears Саппорт A, eyes/headwear Саппорт B, muzzle/ears Танк B).

SSOT чисел: `content/cards/shop_tank_stone_*.json`, `shop_support_water_*.json` · wiki §1 · `D-035`.  
Стиль: тот же **Tavern Hearth Battler**, что в `docs/stitch-prompts-attack-cards-12-heroes.md` §0.

---

## How to paste into Stitch

1. Вставь **§0 Master brief** один раз.  
2. Дальше — **один герой за раз** (§1…§4): копируй блок в \`\`\` целиком.  
3. Если дрейф: *«Keep Tavern Hearth Battler; painted 2D attack cards; soft element tint; Russian titles; no crypto, no kindergarten, no purple-on-white.»*  
4. Export filenames **точно** как в таблице (overwrite old plates).

### Export naming (overwrite)

| id | Filename |
|---|---|
| … | `attack_{templateId}_{part}` → напр. `attack_shop_tank_stone_a_tail` |

Folder (repo):  
- Tank A → `docs/attack-cards/01-tank-a-shit-utes/` + HUD `client/web-hud/public/stitch-assets/attack-cards/01-tank-a-shit-utes/`  
- Tank B → `02-tank-b-proboy/`  
- Support A → `11-support-a-chistyy-rodnik/`  
- Support B → `12-support-b-priliv-sily/`

---

## 0. Master art brief

```
Asset art for «Мифиус: Мифические котики» (Mythfel) — ATTACK / SKILL CARDS for the battle HUD hand.
Not full app screens. Not gear cards. Not new heroes.

RETAKE PASS (D-035): redraw listed cards so ATK / shield / heal / cost gem match the numbers in each prompt EXACTLY. Same hero silhouettes and frame language as existing Mythfel attack plates — only numbers/effects update.

Style:
- «Tavern Hearth Battler» — cozy dark fantasy tavern: peat charcoal (#161310), aged wood/hearthstone frames, bronze clasps, warm lantern gold (#D99B26), vellum title plaque (#F4E8D1).
- Painted 2D, early Axie-like hand-card clarity — NOT crypto/NFT, NOT soft-3D, NOT kindergarten.

Card format:
- Vertical ~2:3 HUD card; cost gem top-left (1 or 2); RU title plaque bottom; readable ATK/shield/heal digits on frame; optional chips (Щит, Таунт, Пробой, Хрупкость, Хил, Слабость, Тыл).
- Element tint thin only: stone = warm grey-ochre; water = soft teal (+ warm gold for buffs on Support B).

Forbidden: inventing numbers/costs/statuses; English-only titles; purple-on-white poster look; gore; crypto badges.
```

---

## Сводка — что перерисовать (17)

| # | Герой | part | RU | cost | Playable (на рамке) |
|---|---|---|---|---|---|
| 1 | Танк A | eyes | Каменный взор | 1 | shield **6** self |
| 2 | Танк A | ears | Уши валуна | 1 | shield **4** ally |
| 3 | Танк A | headwear | Галька-шлем | 1 | shield **8** self |
| 4 | Танк A | back | Щит-валун | 1 | **atk 4 + shield 5** nearest · Таунт *(bash)* |
| 5 | Танк A | tail | Хвост-утёс | 1 | **atk 6** nearest · Хрупкость |
| 6 | Танк B | eyes | Трещина взора | 1 | **atk 5** pierce · Хрупкость |
| 7 | Танк B | headwear | Щит-осколок | 1 | shield **5** · Таунт |
| 8 | Танк B | back | Бронелом | 1 | **atk 7** pierce |
| 9 | Танк B | tail | Хвост-пробой | **1** | atk 5 тыл · pierce · Хрупкость *(gem 1!)* |
| 10 | Саппорт A | eyes | Целительный взгляд | 1 | heal **5** |
| 11 | Саппорт A | muzzle | Капля жизни | 1 | heal **4** |
| 12 | Саппорт A | back | Волна опеки | 2 | heal **2** ally_all |
| 13 | Саппорт A | tail | Очищение | 1 | **atk 4** nearest · heal 2 self *(smite)* |
| 14 | Саппорт B | ears | Шёпот слабости | 1 | **atk 3** · Слабость 2 |
| 15 | Саппорт B | muzzle | Лёгкий хил | 1 | heal **3** |
| 16 | Саппорт B | back | Прилив силы | 2 | heal **2** · shield 2 · бафф ATK |
| 17 | Саппорт B | tail | Ослабить врага | 1 | **atk 5** lowest_hp · Слабость |

---

## 1. Танк A «Щит-утёс» — `shop_tank_stone_a` (5 карт)

```
ATTACK CARDS — Mythfel / Мифиус — D-035 RETAKE (Tank A).

Use master brief. Same stone grey-ochre frame as existing «Щит-утёс» plates.
Redraw FIVE cards with NEW numbers (do not invent):

HERO:
- name_ru: «Щит-утёс»
- role: Танк A (hard-def + guard bash)
- element: stone
- templateId: shop_tank_stone_a
- id_prefix: attack_shop_tank_stone_a

KIT (5 faces):
1) eyes — «Каменный взор» — cost gem 1 — self — shield 6 — art: glowing stone eyes; boulder barrier; chip «Щит»; digit 6 clear; NO ATK.
2) ears — «Уши валуна» — cost gem 1 — ally — shield 4 — art: heavy stone ears wrapping a wounded ally; chip «Щит»; digit 4; supportive, not DPS.
3) headwear — «Галька-шлем» — cost gem 1 — self — shield 8 — art: pebble helm + boulder wall; digit 8; no taunt chip.
4) back — «Щит-валун» — cost gem 1 — nearest — ATK 4 + shield 5 + taunt — art: boulder-guard bash into front foe while wall rises on self; chips «Атака» + «Щит» + «Таунт»; BOTH digits 4 and 5 readable (guard bash).
5) tail — «Хвост-утёс» — cost gem 1 — nearest — ATK 6 · fragile — art: cliff-tail slam cracking armor; chip «Хрупкость»; ATK 6 large; still tank silhouette.

Filenames: attack_shop_tank_stone_a_{eyes|ears|headwear|back|tail}
Russian titles. No crypto. No purple-on-white.
```

---

## 2. Танк B «Пробой» — `shop_tank_stone_b` (4 карты)

```
ATTACK CARDS — Mythfel / Мифиус — D-035 RETAKE (Tank B).

Use master brief. Cracked-stone / pierce frame language (vs Tank A pure wall).
Redraw FOUR cards with NEW numbers:

HERO:
- name_ru: «Пробой»
- role: Танк B (pierce / fragile)
- element: stone
- templateId: shop_tank_stone_b
- id_prefix: attack_shop_tank_stone_b

KIT (4 faces):
1) eyes — «Трещина взора» — cost 1 — nearest — ATK 5 — pierce + fragile — art: cracked glowing eyes; claw splitting a shield; chips «Пробой» + «Хрупкость»; ATK 5.
2) headwear — «Щит-осколок» — cost 1 — self — shield 5 + taunt 2 — art: jagged shard-shield; digit 5; chip «Таунт»; lighter than Tank A walls.
3) back — «Бронелом» — cost 1 — nearest — ATK 7 pierce — art: shoulder-check cracking enemy plate; chip «Пробой»; ATK 7 large.
4) tail — «Хвост-пробой» — cost gem **1** (NOT 2) — backline — ATK 5 pierce + fragile — art: tail spike past frontline into rear; chips «Тыл» + «Пробой»; cost gem clearly 1; ATK 5.

Filenames: attack_shop_tank_stone_b_{eyes|headwear|back|tail}
Russian titles. No invented statuses beyond pierce/fragile/taunt/shield.
```

---

## 3. Саппорт A «Чистый родник» — `shop_support_water_a` (4 карты)

```
ATTACK CARDS — Mythfel / Мифиус — D-035 RETAKE (Support A).

Use master brief. Soft teal water heal aesthetic (milk-teal), tavern combat-world.
Redraw FOUR cards. 3 are heal-only; tail is the kit’s ONE smite (attack + self heal).

HERO:
- name_ru: «Чистый родник»
- role: Саппорт A (heal/cleanse + 1 smite)
- element: water
- templateId: shop_support_water_a
- id_prefix: attack_shop_support_water_a

KIT (4 faces):
1) eyes — «Целительный взгляд» — cost 1 — ally_lowest_hp — heal 5 — art: gentle glowing eyes over wounded ally; heal digit 5; chip «Хил»; NO ATK.
2) muzzle — «Капля жизни» — cost 1 — ally_lowest_hp — heal 4 — art: single water drop over wounded ally; heal digit 4; chip «Хил».
3) back — «Волна опеки» — cost gem 2 — ally_all — heal 2 — art: gentle tide over three allies; heal digit 2; chip «Союзники»; cost gem clearly 2.
4) tail — «Очищение» — cost 1 — nearest — ATK 4 + heal 2 self — art: water-lash smite on front foe while a small tide mends the caster; chips «Атака» + «Хил»; ATK 4 and heal 2 both readable (NOT pure cleanse anymore).

Filenames: attack_shop_support_water_a_{eyes|muzzle|back|tail}
No hospital UI, no kindergarten bubbles. Russian titles.
```

---

## 4. Саппорт B «Прилив силы» — `shop_support_water_b` (4 карты)

```
ATTACK CARDS — Mythfel / Мифиус — D-035 RETAKE (Support B).

Use master brief. Teal heal + warm lantern gold for buffs.
Redraw FOUR cards with NEW numbers:

HERO:
- name_ru: «Прилив силы»
- role: Саппорт B (heal + buff + finish)
- element: water
- templateId: shop_support_water_b
- id_prefix: attack_shop_support_water_b

KIT (4 faces):
1) ears — «Шёпот слабости» — cost 1 — nearest — ATK 3 · weak 2 — art: soft whisper wave sapping front foe; chips «Атака» + «Слабость»; ATK 3.
2) muzzle — «Лёгкий хил» — cost 1 — ally_lowest_hp — heal 3 — art: soft tide heal; digit 3; chip «Хил».
3) back — «Прилив силы» — cost gem 2 — ally_all — heal 2 + shield 2 + ATK buff — art: rising tide empowering trio; chips «Хил» + «Щит» + «Бафф»; heal 2 and shield 2 readable; cost 2.
4) tail — «Ослабить врага» — cost 1 — lowest_hp — ATK 5 · weak 1 — art: focused water lash on the weakest foe (finish); chips «Атака» + «Слабость»; ATK 5 large; feels like execute, not casual poke.

Filenames: attack_shop_support_water_b_{ears|muzzle|back|tail}
No life-drain motifs. Russian titles. No crypto.
```

---

## После генерации (для импорта в репо)

1. Экспорт → имена `attack_shop_*_{part}` как выше.  
2. Положить / заменить в `docs/attack-cards/{01,02,11,12}-…/` и сжать в `client/web-hud/public/stitch-assets/attack-cards/…` (webp как сейчас).  
3. Не менять `cardId` / JSON — числа уже в content (`D-035`).  
4. Smoke: рука в practice — цифры на пластине = wiki/content.
