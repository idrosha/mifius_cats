# Stitch prompts — D-035 tank/support late-finish retune (17 карт)

**Цель:** перерисовать **только** карты, у которых playable числа ушли от арта после `D-035`.  
Подмена файлов 1:1 — те же `attack_shop_*_{part}.webp` / `.png` пути.

**Важно (layout текста):** на эталонных пластинах Mythfel есть **обязательный блок**:
1. роль сверху (ТАНК / ЦЕЛИТЕЛЬ …)  
2. cost gem  
3. иллюстрация  
4. **название** на пергаменте  
5. **строка описания эффекта** сразу под названием (RU, playable)  
6. чипы внизу (Щит / Таунт / Хил …)

Без п.5 карта «пустая» — Stitch обязан впечатать `effect_ru` **буквально**, не сокращать и не выдумывать.

**Не трогать:** fighter / assassin / ranger / mage; карты танков/саппортов вне таблицы.

SSOT чисел: `content/cards/shop_*.json` · wiki · `D-035`.  
Стиль: `docs/stitch-prompts-attack-cards-12-heroes.md` §0.

---

## How to paste into Stitch

1. **§0 Master brief** один раз.  
2. Потом **§1…§4** по одному герою.  
3. Если Stitch снова рисует без описания: *«Mandatory: under the RU title plaque print the exact effect_ru sentence from the kit; do not leave the parchment blank; match existing Mythfel attack-card layout.»*  
4. Filenames overwrite old plates.

### Export naming

`attack_{templateId}_{part}` — напр. `attack_shop_tank_stone_a_tail`  
Folders: `01-tank-a-shit-utes` · `02-tank-b-proboy` · `11-support-a-chistyy-rodnik` · `12-support-b-priliv-sily`

---

## 0. Master art brief

```
Asset art for «Мифиус: Мифические котики» (Mythfel) — ATTACK / SKILL CARDS for the battle HUD hand.
Not full app screens. Not gear cards. Not new heroes.

RETAKE PASS (D-035): redraw listed cards so cost / numbers / RU effect text match the prompt EXACTLY.
Same hero silhouettes and Tavern Hearth Battler frame language as existing Mythfel plates.

CRITICAL TEXT LAYOUT (must match shipped cards):
- Top: role label in RU (ТАНК or ЦЕЛИТЕЛЬ).
- Top-right (or top-left): amber COST GEM with digit 1 or 2.
- Center: painted effect scene (cats, not Axie blobs).
- Below art, aged parchment:
  (1) Card TITLE in Russian (bold).
  (2) Directly under title: one or two short RU EFFECT sentences — copy effect_ru VERBATIM from the kit. This line is mandatory; never leave blank parchment.
  (3) Bottom chips/tags for keywords (Щит, Таунт, Пробой, Хрупкость, Хил, Слабость, Тыл, Бафф).
- Effect text must be large enough to read on mobile thumbnail.
- Do NOT invent different damage/heal/shield numbers than effect_ru.

Style: peat charcoal, carved wood frame, bronze, lantern gold, vellum plaque. Painted 2D cozy dark fantasy.
Forbidden: crypto/NFT; purple-on-white poster; blank effect area; English-only body text; invented math.
```

---

## Сводка effect_ru (копипаст)

| RU title | cost | effect_ru (на карту) | chips |
|---|---|---|---|
| Каменный взор | 1 | Даёт 6 щита себе. | Щит |
| Уши валуна | 1 | Даёт 4 щита слабейшему союзнику. | Щит |
| Галька-шлем | 1 | Даёт 8 щита себе. | Щит |
| Щит-валун | 1 | Наносит 4 урона ближайшему врагу. Даёт 5 щита себе. Таунт. | Атака · Щит · Таунт |
| Хвост-утёс | 1 | Наносит 6 урона ближайшему врагу. Хрупкость. Таунт. | Атака · Хрупкость · Таунт |
| Трещина взора | 1 | Наносит 5 урона ближайшему врагу. Пробой. Хрупкость. | Пробой · Хрупкость |
| Щит-осколок | 1 | Даёт 5 щита себе. Таунт. | Щит · Таунт |
| Бронелом | 1 | Наносит 7 урона ближайшему врагу. Пробой. | Пробой |
| Хвост-пробой | **1** | Наносит 5 урона врагу в тылу. Пробой. Хрупкость. | Тыл · Пробой · Хрупкость |
| Целительный взгляд | 1 | Восстанавливает 5 HP слабейшему союзнику. | Хил |
| Капля жизни | 1 | Восстанавливает 4 HP слабейшему союзнику. | Хил |
| Волна опеки | 2 | Восстанавливает 2 HP всем союзникам. | Хил · Союзники |
| Очищение | 1 | Наносит 4 урона ближайшему врагу. Восстанавливает 2 HP себе. | Атака · Хил |
| Шёпот слабости | 1 | Наносит 3 урона ближайшему врагу. Слабость ×2. | Атака · Слабость |
| Лёгкий хил | 1 | Восстанавливает 3 HP слабейшему союзнику. | Хил |
| Прилив силы | 2 | Восстанавливает 2 HP всем союзникам. Даёт 2 щита. Бафф ATK +1. | Хил · Щит · Бафф |
| Ослабить врага | 1 | Наносит 5 урона врагу с наименьшим HP. Слабость. | Атака · Слабость |

---

## 1. Танк A «Щит-утёс» — `shop_tank_stone_a` (5)

```
ATTACK CARDS — Mythfel / Мифиус — D-035 RETAKE (Tank A) WITH FULL RU EFFECT TEXT.

Use master brief. Role label: ТАНК. Stone grey-ochre frame.
For EVERY card: title + effect_ru verbatim under title on parchment. Do not omit effect text.

HERO: «Щит-утёс» · tank A · stone · templateId shop_tank_stone_a · id_prefix attack_shop_tank_stone_a

1) eyes — title «Каменный взор» — cost 1 — effect_ru: «Даёт 6 щита себе.» — chips: Щит — art: glowing stone eyes, boulder barrier; NO ATK.
2) ears — title «Уши валуна» — cost 1 — effect_ru: «Даёт 4 щита слабейшему союзнику.» — chips: Щит — art: stone ears shielding wounded ally.
3) headwear — title «Галька-шлем» — cost 1 — effect_ru: «Даёт 8 щита себе.» — chips: Щит — art: pebble helm + wall.
4) back — title «Щит-валун» — cost 1 — effect_ru: «Наносит 4 урона ближайшему врагу. Даёт 5 щита себе. Таунт.» — chips: Атака, Щит, Таунт — art: boulder bash + self wall (guard bash).
5) tail — title «Хвост-утёс» — cost 1 — effect_ru: «Наносит 6 урона ближайшему врагу. Хрупкость. Таунт.» — chips: Атака, Хрупкость, Таунт — art: cliff-tail slam; ATK feel 6.

Filenames: attack_shop_tank_stone_a_{eyes|ears|headwear|back|tail}
```

---

## 2. Танк B «Пробой» — `shop_tank_stone_b` (4)

```
ATTACK CARDS — Mythfel / Мифиус — D-035 RETAKE (Tank B) WITH FULL RU EFFECT TEXT.

Use master brief. Role label: ТАНК. Cracked-stone pierce frame.
Title + effect_ru on parchment mandatory.

HERO: «Пробой» · tank B · stone · templateId shop_tank_stone_b · id_prefix attack_shop_tank_stone_b

1) eyes — title «Трещина взора» — cost 1 — effect_ru: «Наносит 5 урона ближайшему врагу. Пробой. Хрупкость.» — chips: Пробой, Хрупкость
2) headwear — title «Щит-осколок» — cost 1 — effect_ru: «Даёт 5 щита себе. Таунт.» — chips: Щит, Таунт
3) back — title «Бронелом» — cost 1 — effect_ru: «Наносит 7 урона ближайшему врагу. Пробой.» — chips: Пробой
4) tail — title «Хвост-пробой» — cost gem **1** (not 2) — effect_ru: «Наносит 5 урона врагу в тылу. Пробой. Хрупкость.» — chips: Тыл, Пробой, Хрупкость — art: tail into rear; gem clearly 1

Filenames: attack_shop_tank_stone_b_{eyes|headwear|back|tail}
```

---

## 3. Саппорт A «Чистый родник» — `shop_support_water_a` (4)

```
ATTACK CARDS — Mythfel / Мифиус — D-035 RETAKE (Support A) WITH FULL RU EFFECT TEXT.

Use master brief. Role label: ЦЕЛИТЕЛЬ. Soft teal water.
Title + effect_ru mandatory. Tail is smite (attack), not pure cleanse.

HERO: «Чистый родник» · support A · water · templateId shop_support_water_a · id_prefix attack_shop_support_water_a

1) eyes — title «Целительный взгляд» — cost 1 — effect_ru: «Восстанавливает 5 HP слабейшему союзнику.» — chips: Хил
2) muzzle — title «Капля жизни» — cost 1 — effect_ru: «Восстанавливает 4 HP слабейшему союзнику.» — chips: Хил
3) back — title «Волна опеки» — cost 2 — effect_ru: «Восстанавливает 2 HP всем союзникам.» — chips: Хил, Союзники
4) tail — title «Очищение» — cost 1 — effect_ru: «Наносит 4 урона ближайшему врагу. Восстанавливает 2 HP себе.» — chips: Атака, Хил — art: water-lash smite + self mend

Filenames: attack_shop_support_water_a_{eyes|muzzle|back|tail}
```

---

## 4. Саппорт B «Прилив силы» — `shop_support_water_b` (4)

```
ATTACK CARDS — Mythfel / Мифиус — D-035 RETAKE (Support B) WITH FULL RU EFFECT TEXT.

Use master brief. Role label: ЦЕЛИТЕЛЬ. Teal + lantern gold buffs.
Title + effect_ru mandatory.

HERO: «Прилив силы» · support B · water · templateId shop_support_water_b · id_prefix attack_shop_support_water_b

1) ears — title «Шёпот слабости» — cost 1 — effect_ru: «Наносит 3 урона ближайшему врагу. Слабость ×2.» — chips: Атака, Слабость
2) muzzle — title «Лёгкий хил» — cost 1 — effect_ru: «Восстанавливает 3 HP слабейшему союзнику.» — chips: Хил
3) back — title «Прилив силы» — cost 2 — effect_ru: «Восстанавливает 2 HP всем союзникам. Даёт 2 щита. Бафф ATK +1.» — chips: Хил, Щит, Бафф
4) tail — title «Ослабить врага» — cost 1 — effect_ru: «Наносит 5 урона врагу с наименьшим HP. Слабость.» — chips: Атака, Слабость — art: finish on weakest foe

Filenames: attack_shop_support_water_b_{ears|muzzle|back|tail}
```

---

## После генерации

1. Проверь глазами: на каждой пластине есть **название + описание** (не пустой пергамент).  
2. Цифры в `effect_ru` = content/`D-035`.  
3. Заменить файлы в `docs/attack-cards/` + HUD webp. JSON не менять.
