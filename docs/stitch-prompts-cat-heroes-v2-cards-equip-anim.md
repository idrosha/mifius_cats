# Промпт: карточки героев v2 — полный рост · экип · анимация

**Статус:** production brief (после approve экранов `SCREEN-01/02/03`)  
**Референсы лиц/тел:** `docs/cat-heroes-v2-preview/SCREEN-0{1,2,3}-*.jpg`  
**Facing эталон:** текущий танк `docs/cat-heroes/battle/tank-a.png` → **смотрит влево** (`CAT_NATIVE_FACE_LEFT`, D-047)  
**Связанный base-промпт:** `docs/stitch-prompts-cat-heroes-v2-18.md`

---

## 0. Цель

Сделать **18 полноценных карточек** (6 классов × 3 стихии), чтобы:

1. Герой в **полный рост**, стоит как воин, **все смотрят в одну сторону — как танки сейчас (влево)**.
2. Base-тело **без запечённой брони/оружия** → при надевании слота видно шлем / броню / плащ / оружие.
3. Позже — **анимация ударов** (поднять меч/ булаву / лук / посох и ударить), без перерисовки всего героя.

---

## 1. Карточка: два файла на героя (D-037)

| Вариант | Фон | Путь | Где |
|---|---|---|---|
| **Portrait** | студия / таверна | `{role}-{element}.png` | кодекс, коллекция, дом, лобби |
| **Battle cutout** | прозрачный RGBA | `battle/{role}-{element}.png` | только live-бой |

Имена (LOCKED):

```
tank-fire · tank-stone · tank-ice
fighter-fire · fighter-stone · fighter-ice
assassin-fire · assassin-stone · assassin-ice
ranger-fire · ranger-stone · ranger-ice
mage-fire · mage-stone · mage-ice
support-fire · support-stone · support-ice
```

---

## 2. Master prompt — IDLE карточка (полный рост)

Копировать блок целиком + суффикс породы/класса из §4–5.

```text
Game character CARD art for "Мифиус: Мифические котики".

FULL BODY anthropomorphic bipedal mythical warrior cat, head-to-toe in frame, paws and tail visible, centered on canvas.

FACING / HEAD (LOCKED — gold standard = idle/tank-fire.jpg):
- Body: bipedal full-body, 3/4 stance (same camera as tank-fire).
- HEAD: turned toward the viewer like tank-fire — both eyes visible, muzzle aimed the same way as the tank. Do NOT put the head in opposite profile; do NOT look over the other shoulder; do NOT quadruped.
- ALL 18 heroes share this identical head-to-body relationship. Tank-fire is the master reference for head orientation.

IDLE WARRIOR STANCE (LOCKED): feet planted shoulder-width, weight balanced, proud chest, ready but not mid-swing. Arms relaxed at sides or class-neutral ready pose WITHOUT held weapons. This is the default card pose and the animation rest pose (frame 0).

PHYSIQUE (LOCKED):
- tank: tallest, densest, heavily muscular jacked
- fighter: muscular too, but smaller volume than tank (toned fighter, not bulk)
- assassin / ranger / mage / support: SLIM THIN lean — NO muscles, NO abs, NOT chubby/fat/plush-thick. Height: assassin shorter · mage smaller · ranger mid-tall · support mid

ASSASSIN FACE (LOCKED): clean breed fur only — NO black/dark eye mask, NO raccoon markings.

IDLE STANCE (LOCKED): standing straight upright, feet parallel, BOTH arms hanging relaxed straight down at sides. NOT hands on head/chin, NOT fists up, NOT crouching.

MYTHIC FACE + CLASS ФИШКА: keep approved identity from SCREEN references — unique face per class (never clone), elemental marks, glow eyes. Breed locked to element (ginger=fire, british grey=stone, persian white=ice).

BASE BODY LAYER ONLY for this pass:
- NO armor plates, NO helmet, NO boots, NO gauntlets
- NO sword/mace/bow/staff/shield/wand in paws
- Mythic fur marks, scars, runes-in-fur, ear tufts, crescent forehead marks, soft aura motes ARE allowed (they belong to the cat, not to gear)

COMPOSITION: vertical card 3:4 (portrait) or 2:3; hero fills ~85% height; safe margin for later UI chrome; crisp silhouette for RGBA cutout.

STYLE: semi-realistic high-fantasy digital PAINTING matching Мифиус shop heroes + approved SCREEN-01/02/03 sheets. Rich fur, dramatic but readable lighting.

Portrait variant: warm tavern/forge background (fireplace).
Battle variant: pure transparent / solid black matte for cutout — NO floor, NO props, NO background furniture.
```

### Negative (idle base)

```text
facing right, front-facing only, T-pose, mid-attack swing, armor, helmet, pauldrons, gauntlets, boots, sword in hand, mace, bow, staff, shield, dual weapons, floating UI, text, watermark, identical faces across classes, fox head on cat body, quadruped, chibi, cropped feet, cropped tail
```

---

## 3. Экипировка = слои (paper-doll), не новый портрет

### 3.1 Слоты (порядок отрисовки снизу → сверху)

| z | slot id | Что | Крепится к |
|---|---|---|---|
| 0 | `base` | тело + голова + хвост (idle) | — |
| 1 | `boots` | поножи / лапы | голени |
| 2 | `armor` | нагрудник / торс / наплечники | грудь/плечи |
| 3 | `cloak` | плащ / спина | спина (хвост поверх или вырез под хвост) |
| 4 | `helm` | шлем / убор | голова (глаза и морда читаемы) |
| 5 | `offhand` | щит / сфера / тотем | левая лапа (при face-left = ближе к зрителю или дальняя — **LOCKED один раз**) |
| 6 | `weapon` | меч / булава / кинжалы / лук / посох | правая лапа / обе |

**Правило HUD:** `visible = base + Σ equipped slots`. Снял слот → слоя нет, виден мех.

### 3.2 Промпт оверлея (один слот за раз)

```text
Transparent PNG equipment OVERLAY for the SAME hero idle pose and SAME left-facing camera as the base card.
Draw ONLY the {SLOT} piece(s): {ITEM_DESCRIPTION}.
Align exactly to the provided base-body reference: same scale, same pivot, same 3/4 left-facing stance.
Do NOT redraw the cat body. Do NOT include head/fur/tail except where the item naturally covers.
Transparent background. Clean hard edges. No drop shadow outside the item.
Element tint: {fire ember | stone mineral gold | ice frost blue} matching hero element.
Class-appropriate silhouette: tank heavy plate · fighter mid plate/leather · assassin light leather · ranger leather+quiver mounts · mage cloth+metal trim · support robes+metal accents — but THIS call is only the named slot.
```

### 3.3 Согласование лап с оружием

Для анимации и экипа:

- **Weapon hand** = передняя по направлению удара (при face-left: дальняя или ближняя — зафиксировать в арт-библии один раз для всех 18).
- Рекомендация LOCKED: **правая лапа героя держит weapon**, **левая — offhand/щит** (как у текущего tank-a: щит + булава).
- Base idle: лапы в нейтрали с **пустыми socket-позами** (лёгкий хват), чтобы оверлей оружия сел без сдвига кисти.

---

## 4. Суффиксы породы / стихии

```text
FIRE / ginger: orange tabby stripes, amber eyes, ember rim on mythic marks.
STONE / british grey: dense blue-grey plush fur, round face, copper/amber eyes, mineral crystal flecks.
ICE / persian white: long white fluff, chest ruff, ice-blue eyes, frost motes on marks.
```

---

## 5. Суффиксы класса (idle, без оружия)

```text
TANK: tallest densest, mane cheeks, scarred brow, fortress stance.
FIGHTER: shredded, battle scars, fierce glare, ready fists (empty).
ASSASSIN: shorter ripped, dark eye-mask markings, sly half-lidded eyes, coiled but standing idle (not lunging).
RANGER: lynx ear tufts, alert hunter eyes, tall scout stance.
MAGE: facial/chest runes-in-fur, glowing pupils, composed upright; empty hands (staff is overlay).
SUPPORT: crescent forehead mark, soft halo glow ok, open calm warrior stance; empty hands (orb/staff overlay).
```

---

## 6. Анимация (фаза 2) — заложить сейчас

### 6.1 Принцип

Не рисовать «новый герой на каждый кадр с нуля».  
**Riggable layers** + короткий клип удара:

```
base_body (idle / attack frames)
 + armor/cloak/helm overlays (деформируются вместе или parent к костям)
 + weapon overlay (родитель = weapon hand bone)
```

### 6.2 Клипы (минимум на класс)

| clip | кадры (реком.) | Что происходит |
|---|---|---|
| `idle` | 1–4 (дыхание) | лёгкий breathe; уже есть MF-149 idle |
| `attack` | 6–8 | замах → удар → recover → idle |
| `hit` | 2–3 | лёгкий recoil |
| `cast` (mage/support) | 6–8 | подъём лапы/оружия → вспышка |
| `shoot` (ranger) | 6–8 | натяжение → выстрел |
| `death` | optional later | — |

### 6.3 Промпт спрайт-листа атаки (после idle+экип)

```text
Animation sprite sheet for the SAME left-facing mythical warrior cat hero, full body.
Keep identical design, proportions, and equipment as the idle card reference.
Horizontal strip OR 2-row sheet, equal frame size, transparent background.

Clip: ATTACK
Frame 1: idle ready (match card pose)
Frame 2: wind-up — weapon hand rises, torso coils
Frame 3: peak raise — weapon high
Frame 4: strike contact — weapon swings forward along face direction (to the LEFT)
Frame 5: follow-through
Frame 6: recover toward idle

Weapon moves with the hand. Armor pieces stay locked to body volumes (no sliding).
No motion blur mush; readable silhouettes per frame.
Do not change facing. Do not mirror mid-sheet.
```

### 6.4 Классовое оружие для анимации (дефолт kit)

| Класс | weapon | offhand | motion |
|---|---|---|---|
| tank | булава / молот | щит | подъём булавы → удар сверху/сбоку |
| fighter | меч / когти-клинки | — / парный клинок | рубящий slash |
| assassin | кинжал(и) | — | быстрый thrust / dual slash |
| ranger | лук | колчан (cloak/back) | натяжение → shot |
| mage | посох | — | подъём посоха → cast pulse |
| support | посох / сфера | — | подъём → heal/buff flash |

Стихия красит VFX оружия (огонь / камень-золото / лёд), не меняет facing.

### 6.5 Техтребования под Unity / web HUD

- Canvas единый: например **1024×1536** (portrait) и battle cutout тот же кадр без фона.
- Pivot: между ступнями по центру (для flip `scaleX` и hop).
- Weapon socket: якорь на запястье правой лапы; offhand — на левой.
- Имена кадров: `{id}_attack_01.png` … или spritesheet `{id}_attack.png` + JSON frame rects.
- Пока web-HUD: можно начать с **2–3 ключевых кадра** (wind-up / strike / idle) и CSS/JS swap; Unity — полный клип.

---

## 7. Порядок производства

1. **Idle base ×18** — face LEFT, без брони/оружия (по SCREEN + этот master).  
2. **Battle cutouts ×18** — те же позы, RGBA.  
3. **Gear overlays** — сначала grey/common set на 1 герое-пилоте (tank-stone), потом раскат на 18.  
4. **Compose smoke** — base ± helm ± armor ± weapon в HUD складе/бое.  
5. **Attack sheets** — пилот tank + fighter + mage; затем остальные.  
6. Влитие в `stitch-assets/cat-heroes/` + `CAT_NATIVE_FACE_LEFT` для **всех** новых slug’ов (все face left).

---

## 8. Однострочный шаблон генерации idle

```text
{MASTER IDLE §2}

Hero id: {role}-{element}. Breed/element: {FIRE|STONE|ICE block}. Class: {class block}.
Full-body idle warrior card, facing LEFT like tank-a, no armor, no weapons, mythic class face from approved sheet.
Portrait with tavern background. Aspect 3:4.
```

## 9. Однострочный шаблон экипа

```text
{OVERLAY §3.2}
Base reference: {role}-{element} idle left-facing.
Slot: {helm|armor|cloak|boots|weapon|offhand}.
Item: {name + material + element tint}.
Transparent PNG overlay only.
```

## 10. Однострочный шаблон атаки

```text
{ATTACK SHEET §6.3}
Hero: {role}-{element} with equipped {weapon/offhand} visible.
Class motion: {table §6.4}.
6 frames left-facing attack, transparent, equal size.
```

---

## 11. Definition of Done

- [ ] 18 idle portrait + 18 battle cutouts, все face **left** как tank-a  
- [ ] На любом герое можно включить/выключить слоты экипа без нового body-арта  
- [ ] Пилот `attack` клип: видно подъём оружия и удар в сторону взгляда  
- [ ] Не влито в main stitch-assets до финального approve  

**Не делать:** запекать броню в base; разные направления взгляда у разных классов; анимацию через полностью новые «похожие» модели без общего idle.
