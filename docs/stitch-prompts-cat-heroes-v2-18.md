# Промпт: герои котиков v2 — 18 base-body (без доспехов)

**Статус:** preview before main · **не** подменять `stitch-assets/cat-heroes/` пока арт не утверждён  
**Превью:** `docs/cat-heroes-v2-preview/`  
**Цель:** один base-body на героя; доспех/оружие — отдельные оверлеи при экипировке (не запечены в спрайт).

---

## 0. Матрица 6×3 = 18

| Роль | Рыжий · `fire` | Британский серый · `stone` | Персидский белый · `ice` |
|---|---|---|---|
| **tank** | `tank_fire` | `tank_stone` | `tank_ice` |
| **fighter** | `fighter_fire` | `fighter_stone` | `fighter_ice` |
| **assassin** | `assassin_fire` | `assassin_stone` | `assassin_ice` |
| **ranger** | `ranger_fire` | `ranger_stone` | `ranger_ice` |
| **mage** | `mage_fire` | `mage_stone` | `mage_ice` |
| **support** | `support_fire` | `support_stone` | `support_ice` |

**Порода = стихия (LOCKED):**

| Порода | element | Шерсть | Глаза | Силуэт породы |
|---|---|---|---|---|
| Рыжий (ginger tabby) | `fire` | рыжий/оранжевый с полосками, тёплый подшёрсток | янтарь | средний ворс, выразительные полоски на хвосте |
| Британский серый (British Shorthair) | `stone` | плотный blue-grey, «плюшевый» короткий ворс | медь / янтарно-зелёный | круглая морда, массивная шея, короткий плотный хвост |
| Персидский белый (Persian) | `ice` | длинный белый пух, грива на груди | голубые / ледяные | плоская морда, очень пушистый хвост, «облачный» силуэт |

---

## 1. Master prompt (общий блок — копировать в каждый генератор)

```text
Game character concept art for "Мифиус: Мифические котики" — anthropomorphic BIPEDAL warrior cat hero, FULL BODY, standing upright like a fantasy warrior on digitigrade legs, facing 3/4 to the RIGHT (native face RIGHT for HUD flip), centered, head-to-toe visible, paws and tail fully in frame.

PHYSIQUE (LOCKED — match reference muscle sheet): heavily muscled warrior body under fur — broad V-taper shoulders, thick pecs, deep abs visible through fur, powerful arms and thighs, heroic chest. ALL 18 heroes are jacked warrior cats (not skinny, not chubby, not cute-chibi). Class differs by HEIGHT / WIDTH / pose attitude, NOT by losing muscle:
- tank = tallest, thickest, densest muscle mass, widest stance
- fighter = peak shredded combat athlete, fists ready
- assassin = slightly shorter but still ripped, coiled predator stance
- ranger = tall athletic warrior muscle, alert scout stance
- mage = still muscular warrior torso, composed upright “arcane fighter” stance (NOT frail)
- support = strong solid warrior build, open confident blessing stance (NOT soft/weak)

POSE: stand like warrior cats — feet planted, proud chest, warrior readiness, heroic full-body silhouette. Never slumped, never quadruped, never T-pose mannequin.

MYTHIC IDENTITY (LOCKED — not ordinary housecats): each hero is a *mythical* cat — elemental fur glow, fantasy facial markings, unique eyes, class “фишка” readable without gear. Still NO armor/weapons (those are overlays later).

FACE RULE (LOCKED): every class has a DIFFERENT face — different muzzle shape, eye shape, brow, ear set, expression, scar/mark pattern. NEVER clone one face across the lineup.

Class mythic features WITHOUT armor (must be obvious):
- tank: heavy scarred brow, thick mane/cheek fluff, stubborn jaw, stone/ember vein-markings under fur, glowing earthy eyes, fortress stance
- fighter: fierce battle-scarred face, sharper fangs visible, ember-tipped whiskers/fur, hot amber glare, fists ready brawler attitude
- assassin: narrow fox-sharp muzzle, half-lidded sly eyes with slit glow, darker face mask markings, longer ears, coiled lean predator stance
- ranger: lynx ear-tufts, keen hunter eyes, leaf/ash facial freckle-marks, alert scout face looking far, tall proud scout stance
- mage: arcane pupil glow (element color), mystical facial runes painted in fur, slightly elongated wise muzzle, composed raised-paw focus gesture, faint elemental aura around head/chest
- support: warmer kind warrior eyes with soft halo glow, crescent/moon facial marks, gentler smile but still jacked, open blessing paws with tiny elemental motes

Element tint on mythic marks only (not props):
- fire/ginger → warm ember glow on marks/eyes/whiskers
- stone/grey → mineral crystal flecks, cool grey-gold vein glow
- ice/white → frost-kiss marks, pale blue pupil glow, icy motes

BASE BODY ONLY — NO armor, NO helmet, NO weapons, NO staff, NO bow, NO shield. Mythic marks + aura + unique face ARE allowed. Equipment overlays come later.

Art style: SAME as current Мифиус mythical cat portraits — semi-realistic high-fantasy digital PAINTING (not plastic 3D, not plain photo-cat), rich painted fur, fantasy character design energy like existing shop heroes, jacked body from muscle reference.

Crisp edges for later RGBA cutout. No text, no UI, no watermark, no extra animals.
```

---

## 2. Породные / стихийные суффиксы

### 2.1 Рыжий · fire

```text
Breed: ginger orange tabby cat — warm orange fur with classic dark-orange stripes on face, legs, and ringed tail; white or cream muzzle/chest optional; amber eyes; medium fur length; subtle warm ember rim-light on fur tips ONLY (no fire weapons, no flaming claws). Element identity = fire via coat color and warm lighting, not via held props.
```

### 2.2 Британский серый · stone

```text
Breed: British Shorthair blue-grey cat — dense plush short grey-blue coat, round cheeks, thick neck, copper or green-amber eyes, sturdy compact body, short thick grey tail. Cool stone-grey fur, soft cool rim light. Element identity = stone via coat/grey mass, not via rock armor or hammers.
```

### 2.3 Персидский белый · ice

```text
Breed: white Persian cat — long fluffy pure-white coat, flat sweet face, dense chest ruff, very fluffy plume tail, pale ice-blue eyes. Soft cool white fur with faint frost-kiss highlights on tips ONLY (no ice staff, no crystals). Element identity = ice via white fluff and cool highlights, not via props.
```

---

## 3. Per-hero prompts (склеить: Master + порода + роль)

Имена файлов preview: `{role}-{element}-base.png`  
Пример: `tank-fire-base.png`

| # | id | Prompt-хвост роли |
|---|---|---|
| 1 | tank_fire | Master + ginger/fire + tank silhouette/pose |
| 2 | tank_stone | Master + british/stone + tank |
| 3 | tank_ice | Master + persian/ice + tank |
| 4 | fighter_fire | Master + ginger/fire + fighter |
| 5 | fighter_stone | Master + british/stone + fighter |
| 6 | fighter_ice | Master + persian/ice + fighter |
| 7 | assassin_fire | Master + ginger/fire + assassin |
| 8 | assassin_stone | Master + british/stone + assassin |
| 9 | assassin_ice | Master + persian/ice + assassin |
| 10 | ranger_fire | Master + ginger/fire + ranger |
| 11 | ranger_stone | Master + british/stone + ranger |
| 12 | ranger_ice | Master + persian/ice + ranger |
| 13 | mage_fire | Master + ginger/fire + mage |
| 14 | mage_stone | Master + british/stone + mage |
| 15 | mage_ice | Master + persian/ice + mage |
| 16 | support_fire | Master + ginger/fire + support |
| 17 | support_stone | Master + british/stone + support |
| 18 | support_ice | Master + persian/ice + support |

**Однострочный шаблон для генератора:**

```text
{MASTER_PROMPT}

{BREED_ELEMENT_BLOCK}

Role: {ROLE_POSE_BLOCK}. Full-body anthropomorphic cat, no armor, no weapons. Vertical portrait 3:4.
```

---

## 4. Правила экипировки (для следующих батчей, не для base)

Когда base утверждён — генерировать **отдельные** слоты оверлея под тот же ракурс/силуэт:

| Слот | Что рисуем | Правило |
|---|---|---|
| `helm` | шлем / убор | не перекрывает глаза полностью; foreleg/paw free |
| `armor` | нагрудник / торс | сидит на корпусе base; мех лап/хвоста виден |
| `cloak` | плащ / спина | за спиной, не режет силуэт хвоста |
| `weapon` | оружие / щит / посох / лук | в лапах или на спине; element-tint по `fire`/`stone`/`ice` |

**Нельзя** запекать оружие в base-портрет. В бою HUD показывает `base + equipped overlays`.

Силуэт роста (D-048) сохраняем: assassin/mage < ranger < support < fighter < tank.

---

## 5. Deliverables pipeline

1. **Preview (этот шаг):** 18 base full-body со студийным фоном → `docs/cat-heroes-v2-preview/`  
2. Review / правки пород и поз  
3. Battle cutouts RGBA (`…/battle/`)  
4. Только после approve — копировать в `client/web-hud/public/stitch-assets/cat-heroes/` + wiki §1.0 + LiveOps 18 SKU  
5. Отдельный батч gear overlays

---

## 6. Negative prompt (общий)

```text
armor, plate mail, helmet, pauldrons, gauntlets, boots, sword, dagger, bow, staff, shield, wand, jewelry set, crown, cape with metal clasps, glowing weapons, floating UI, text, watermark, chibi, quadruped-only cat, human face, dog, multiple characters, cropped feet, cropped tail, front-facing mugshot only, busy collage background
```
