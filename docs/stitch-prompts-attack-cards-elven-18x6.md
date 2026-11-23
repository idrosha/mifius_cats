# Промпт-пакет: карты атаки ×18 героев (elven chrome · fire / water / wind)

**Цель:** сгенерировать **108** заполненных карт атаки (18 героев × 6 частей колоды) с иллюстрацией, названием и описанием под три стихии.  
**Chrome:** `client/web-hud/public/stitch-assets/attack-cards/chrome/elven/card_frame_{fire|water|wind}.jpg`  
**Баланс:** любая команда **tank · DPS · support** должна быть **равна в PvP**; архетипы внутри класса решают **разные PvE-задачи**.

---

## 0. Матрица героев 6×3 = 18

| Роль | Огонь · `fire` | Вода · `water` | Ветер · `wind` |
|---|---|---|---|
| **tank** | `tank_fire` | `tank_water` | `tank_wind` |
| **fighter** | `fighter_fire` | `fighter_water` | `fighter_wind` |
| **assassin** | `assassin_fire` | `assassin_water` | `assassin_wind` |
| **ranger** | `ranger_fire` | `ranger_water` | `ranger_wind` |
| **mage** | `mage_fire` | `mage_water` | `mage_wind` |
| **support** | `support_fire` | `support_water` | `support_wind` |

**Колода героя N=6 (LOCKED parts):** `eyes` · `ears` · `muzzle` · `headwear` · `back` · `tail`  
**Имя файла:** `attack_{role}_{element}_{part}.jpg`  
Пример: `attack_tank_fire_muzzle.jpg`

**Стихия chrome:** карта `fire` → `card_frame_fire.jpg`; `water` → `card_frame_water.jpg`; `wind` → `card_frame_wind.jpg`.

**Элементный треугольник (для lore / PvE бонусов; PvP power equal):**
- fire бьёт wind, слаб к water  
- water бьёт fire, слаб к wind  
- wind бьёт water, слаб к fire  
Родство (element карты = element героя): **+10%** atk/shield/heal как в SSOT.

---

## 1. Архетипы по классу (3 стихии = 3 build’а)

Каждый класс даёт **три равносильных PvP-кита**, но разные **PvE-роли**. Цифры — стартовый бюджет (cost 1–2; LiveOps `D-035` retune).

### 1.1 Tank (все: обязательный `taunt` ≥2 карты в ките)

| # | id | PvP-архетип | PvE-задача | Kit focus |
|---|---|---|---|---|
| 1 | `tank_fire` | **Taunt + урон** | держать агро + дожимать солдат | bash / poke / self-shield; atk на nearest; taunt 2 |
| 2 | `tank_water` | **Taunt + pierce + урон** | ломать щиты питбоссов / бронированных | `pierce`/`fragile`; taunt; mid atk |
| 3 | `tank_wind` | **Taunt + reflect** | отвечать на масс-удары / thorns-челенджи | `reflect`/`thorns`-like on-hit; taunt; low raw atk |

**Reflect (LOCK proposal):** когда танк под taunt получает удар — **30–40%** входящего atk возвращается атакующему (не life-steal; не обходит pierce incoming). Не стакать с полным игнором урона.

### 1.2 Fighter (ST / heavy / hybrid)

| # | id | Архетип | PvE | Kit |
|---|---|---|---|---|
| 1 | `fighter_fire` | **Burst ST + crit** | убийство одного приоритета | dual/crit, bleed, ruffle |
| 2 | `fighter_water` | **Heavy smash** | толстый одиночный урон по боссу | high atk cost2, fragile |
| 3 | `fighter_wind` | **Hybrid cleave** | волна солдат + дожим | 1–2 AoE half + ST finish |

### 1.3 Assassin (stealth / backline / DoT)

| # | id | Архетип | PvE | Kit |
|---|---|---|---|---|
| 1 | `assassin_fire` | **Crit + stealth** | уворот / дуэль DPS | crit, stealth, short stun |
| 2 | `assassin_water` | **Backline execute** | снять хила/мага босса | `backline` + crit + poison |
| 3 | `assassin_wind` | **Spread DoT** | яд по пачке (`random_enemy`) | poison stacks, `random_enemy` (taunt ignore) |

### 1.4 Ranger (hunter / AoE / mark)

| # | id | Архетип | PvE | Kit |
|---|---|---|---|---|
| 1 | `ranger_fire` | **Hunter lowest_hp** | добивание | `lowest_hp` + ambush + weak |
| 2 | `ranger_water` | **Mass volley** | чистка солдат | `all_enemies` mid atk |
| 3 | `ranger_wind` | **Mark + pierce shot** | marked target / focus fire | mark→ally bonus; 1 pierce backline |

### 1.5 Mage (burst AoE / control / hybrid)

| # | id | Архетип | PvE | Kit |
|---|---|---|---|---|
| 1 | `mage_fire` | **AoE burst + vuln** | пачка + soften | `all_enemies`, crit, vuln |
| 2 | `mage_water` | **Control freeze** | стоп питбосса / stun | `stun`1, weak, mid AoE |
| 3 | `mage_wind` | **Hybrid bolt** | ST контроль + splash | ST stun/weak + small AoE |

### 1.6 Support (cleanse / buff / sustain)

| # | id | Архетип | PvE | Kit |
|---|---|---|---|---|
| 1 | `support_fire` | **Heal + smite** | sustain + soft DPS | heal lowest + 1 smite atk |
| 2 | `support_water` | **Heal + cleanse** | снять poison/bleed/stun-setup | heal + cleanse ×N |
| 3 | `support_wind` | **Heal + team buff** | окно burst / shield party | ATK buff / small ally shield + heal |

---

## 2. PvP-баланс (LOCKED design rules)

Команда-референс: **tank (lane0) · любой DPS (lane1) · support (lane2)**.

1. **Equal power band:** суммарный `card_power` кита (atk + shield + heal×0.9 + control-weight) в диапазоне **±5%** между всеми 18 китами.  
2. **Energy curve:** в каждом ките **4–5 карт cost 1**, **1–2 карты cost 2** (AoE / big heal / heavy smash). Нет cost 3 на soft-launch.  
3. **Role budget:**
   - Tank: shield+taunt доминируют; raw atk ≤ fighter −25%.  
   - DPS (fighter/assassin/ranger/mage): heal ≤ 1 token card или 0.  
   - Support: ≥4 heal/cleanse/buff; ≤2 soft-atk.  
4. **Anti-snowball:** life-drain / full HP refresh в бою — запрещены (SSOT).  
5. **Taunt fairness:** все 3 танка одинаково держат агро ≥2 хода за цикл колоды.  
6. **Mirror check:** fire-tank + water-DPS + wind-support ≈ любой другой triad по winrate в sim (±2%).  
7. **PvE hooks не ломают PvP:** reflect / pierce / cleanse / AoE сильнее в длинных боях, но в 3v3 коротком PvP компенсируются cost и меньшим raw.

### 2.1 Рекомендуемые цифры-якоря (cost 1 baseline)

| Тип карты | Якорь |
|---|---|
| ST atk | 4–6 |
| ST atk + crit tag | 3–4 (×2 on crit) |
| pierce ST | 5–7 |
| AoE primary | 2–3 (secondary 50%) |
| self/ally shield | 5–8 |
| heal single | 3–5 |
| heal all (cost 2) | 2 each |
| taunt duration | 2 хода |
| stun | 1 ход, обычно cost 2 или lower atk |
| poison/bleed stack | 1–2 |

---

## 3. Связки / синергии (интересные комбо)

Пиши в описаниях карт **короткий hint**, не формулы.

| Связка | Кто | Зачем |
|---|---|---|
| Taunt → Reflect | `tank_wind` + любой AoE врага | PvE масс-удары питбосса |
| Pierce window | `tank_water` fragile + `fighter_water` / `ranger_wind` | ломать shield-боссов |
| Vuln → Burst | `mage_fire` vuln + `fighter_fire` crit | PvP kill window |
| Freeze → Execute | `mage_water` stun + `assassin_water` backline | снять саппорта |
| Mark → Hunter | `ranger_wind` mark + `ranger_fire`/`assassin_*` | focus fire |
| Cleanse after taunt-stun | `support_water` + любой tank | PvE: питбосс stun с таунта (`D-051`) |
| Buff window | `support_wind` ATK buff + `fighter_*` / `mage_fire` | burst round |
| Poison spread | `assassin_wind` random_enemy | PvE пачки без пробития taunt |
| Cleave clear | `fighter_wind` / `ranger_water` / `mage_fire` | солдаты f1/f2 |
| Smite finish | `support_fire` tail smite + hunter | добить lowest_hp |

**Правило дизайна кита:** в каждом из 6 карт героя заложить **минимум 2** карты, которые усиливают «свою» связку, и **1** универсальную (чтобы не ломать mirror PvP).

---

## 4. Слоты колоды (что класть в какую part)

| Part | Narrative slot | Что обычно класть |
|---|---|---|
| `eyes` | взгляд / прицел | opener: scan, mark, small atk, soft shield/heal |
| `ears` | слух / реакция | utility: cleanse hint, ambush, ally shield, weak |
| `muzzle` | укус / клич | signature: taunt shout, heavy bite, heal kiss |
| `headwear` | убор / корона | defense / identity: shield, buff, control |
| `back` | спина / оружие-силуэт | big beat: AoE, cost2, bash+taunt |
| `tail` | хвост / финиш | finisher: pierce, smite, execute, reflect seal |

В каждом ките: **≥1** карта с доступом к нужной PvE-задаче архетипа; melee roles: **≥1** `backline` или AoE если роль это требует (assassin_water, ranger_*, mage_*).

---

## 5. Master art prompt (карта целиком)

Копировать в генератор **на каждую** карту; подставить блок ELEMENT + HERO + CARD из таблиц ниже.

```text
Filled fantasy attack skill CARD for the game "Мифиус: Мифические котики".
Vertical collectible card, aspect ~2:3 / 3:4, flat orthographic front view (NOT photo mockup, NOT tilted).

Use the approved ELVEN chrome frame for this element (reference the matching card_frame_{element} asset): ornate elven filigree vines, leaf scrolls, pointed arches, runic side rails, metal tone matching the element. Same locked UI layout: top element socket + CLASS plaque + cost gem; large art window; TITLE; description; bottom effect tabs.

COMPOSITE RULES:
- Art window: show ONLY the skill illustration (mythic bipedal warrior cat using this ability) — NO empty grey. Illustration must fit inside the art window, crisp edges, readable at mobile hand size.
- Top CLASS plaque text: {CLASS_RU} (Танк / Боец / Ассасин / Стрелок / Маг / Саппорт)
- Cost gem: number {COST}
- TITLE: Russian fantasy name {CARD_NAME}
- Description: 1–2 short Russian lines {CARD_DESC} (effect fantasy wording, not raw JSON)
- Bottom tabs: light matching tags among: buff, debuff, 2x, crit, pierce, heal, shield, taunt, aoe (only those that apply; others empty/dim)

STYLE: semi-realistic painted fantasy UI, rich elven metal + parchment, match chrome references. No watermark, no logo, no QR, no modern UI chrome, no purple neon spam.

HERO LOCK: anthropomorphic bipedal mythic cat, muscular warrior build, breed/element identity:
{BREED_BLOCK}
Class mythic face/pose: {CLASS_FACE}
Action depicted: {ACTION_BEAT}
Element VFX only as {ELEMENT_VFX} — no unrelated props clutter.
```

### 5.1 Breed / element blocks

**fire**
```text
Ginger orange tabby mythic cat; warm ember glow in eyes/marks; element VFX = sparks, heat-haze, ember motes.
```

**water**
```text
Sleek water-affinity mythic cat (cool silver-blue or seafoam accents on fur marks); element VFX = droplets, ripples, mist, soft aqua glow.
```

**wind**
```text
Lithe wind-affinity mythic cat (pale silver/celadon accents); element VFX = swirl lines, feathers of air, leaf-gust, pale green-white trails.
```

### 5.2 Per-card generator row (заполнять 108 раз)

| field | example |
|---|---|
| `heroId` | `tank_fire` |
| `part` | `muzzle` |
| `CLASS_RU` | `Танк` |
| `COST` | `1` |
| `CARD_NAME` | `Оскал жара` |
| `CARD_DESC` | `Рёв провоцирует врагов. Даёт щит и таунт.` |
| `tags` | `taunt, shield` |
| `targetRule` | `self` / `nearest` / … |
| `numbers` | `shield 6 · taunt 2` |
| `ACTION_BEAT` | `tank cat roaring with ember breath, shield raised` |

---

## 6. Старт-наполнение китов (имена + эффекты — черновик для арта)

> Цифры = design target; playable SoT потом в content / `D-035`.  
> Формат строки: `part` — **Имя** — cost — эффект.

### Tank Fire — taunt + урон
1. eyes — **Жаркий взор** — 1 — self shield 5  
2. ears — **Слух горна** — 1 — ally shield 3  
3. muzzle — **Оскал жара** — 1 — shield 6 · taunt 2  
4. headwear — **Шлем углей** — 1 — shield 7  
5. back — **Удар щита-жара** — 1 — atk 5 nearest · shield 3 · taunt  
6. tail — **Хлыст пламени** — 1 — atk 6 nearest  

### Tank Water — taunt + pierce
1. eyes — **Трещина волны** — 1 — atk 5 pierce · fragile 1  
2. ears — **Слух бреши** — 1 — atk 5 pierce  
3. muzzle — **Клык прилива** — 1 — atk 5 · fragile 2 · pierce  
4. headwear — **Шлем пены** — 1 — shield 5 · taunt 2  
5. back — **Таран глубины** — 1 — atk 7 pierce  
6. tail — **Хвост-пробой** — 1 — atk 5 backline · pierce · fragile 1  

### Tank Wind — taunt + reflect
1. eyes — **Взор бури** — 1 — self shield 5 · reflect aura 1  
2. ears — **Слух отката** — 1 — ally shield 3  
3. muzzle — **Рёв ветра** — 1 — shield 6 · taunt 2  
4. headwear — **Корона шквала** — 1 — shield 6 · reflect 1  
5. back — **Щит-вихрь** — 1 — shield 4 · taunt · reflect 2  
6. tail — **Ответный порыв** — 1 — atk 4 nearest · reflect pulse  

### Fighter Fire — burst crit
1. eyes — **Искрящий взгляд** — 1 — atk 3×2 · bleed 1  
2. ears — **Боевой слух** — 1 — atk 4 crit · ruffle  
3. muzzle — **Парный укус** — 1 — atk 4 · bleed 2  
4. headwear — **Корона искр** — 1 — atk 5 crit  
5. back — **Двойной удар** — 2 — atk 4×2 crit  
6. tail — **Хлыст жара** — 1 — atk 6 · bleed 1  

### Fighter Water — heavy smash
1. eyes — **Тяжёлый взор** — 1 — atk 7 · bleed 1  
2. ears — **Рёв стали-воды** — 1 — atk 6 · fragile 1  
3. muzzle — **Молот прилива** — 2 — atk 10  
4. headwear — **Шлем вала** — 1 — atk 6 · bleed 2  
5. back — **Двуручный шквал** — 1 — atk 8 · fragile 1  
6. tail — **Добивающий вал** — 1 — atk 7 backline  

### Fighter Wind — hybrid cleave
1. eyes — **Взор порыва** — 1 — atk 5 nearest  
2. ears — **Слух строя** — 1 — atk 3 all_enemies  
3. muzzle — **Клык вихря** — 1 — atk 6  
4. headwear — **Лента ветра** — 1 — atk 4 · weak 1  
5. back — **Ветряной размах** — 2 — atk 3 all_enemies · atk 2 nearest bonus  
6. tail — **Финальный порыв** — 1 — atk 6 lowest_hp  

### Assassin Fire — stealth crit
1. eyes — **Глаза мглы-жара** — 1 — atk 3 · stun 1  
2. ears — **Шёпот искр** — 1 — atk 4 · poison 1  
3. muzzle — **Теневой укус** — 1 — atk 5 crit  
4. headwear — **Маска угля** — 1 — stealth 1 · atk 3  
5. back — **Удар из тени** — 1 — atk 6 crit · stealth  
6. tail — **Исчезновение** — 1 — atk 4 · stealth  

### Assassin Water — backline execute
1. eyes — **Прицел в спину** — 1 — backline atk 4 crit · poison 1  
2. ears — **Слух тыла** — 1 — backline atk 3 · stun 1  
3. muzzle — **Укол прилива** — 1 — backline atk 5 · poison 2  
4. headwear — **Капюшон пены** — 1 — backline atk 4 crit  
5. back — **Казнь сзади** — 2 — backline atk 7 crit  
6. tail — **Тихий разряд** — 1 — backline atk 5 · poison 1  

### Assassin Wind — spread DoT
1. eyes — **Глаза сквозняка** — 1 — random_enemy atk 3 · poison 2  
2. ears — **Слух роя** — 1 — random_enemy atk 3 · poison 1  
3. muzzle — **Ядовитый порыв** — 1 — nearest atk 4 · poison 2  
4. headwear — **Маска пыльцы** — 1 — random_enemy poison 2  
5. back — **Шквал яда** — 2 — random_enemy atk 2×2 · poison 1  
6. tail — **Хвост-зараз** — 1 — random_enemy atk 4 · poison 2  

### Ranger Fire — hunter
1. eyes — **Глаз добычи** — 1 — lowest_hp atk 4 ambush · weak 1  
2. ears — **Уши засады** — 1 — nearest atk 4 ambush · bleed 1  
3. muzzle — **Выстрел жара** — 1 — lowest_hp atk 5  
4. headwear — **Капюшон охоты** — 1 — lowest_hp atk 4 crit  
5. back — **Огненная стрела** — 1 — lowest_hp atk 6 ambush  
6. tail — **Добивание** — 1 — lowest_hp atk 5 · weak 1  

### Ranger Water — mass volley
1. eyes — **Широкий взор** — 1 — all_enemies atk 2 · weak 1  
2. ears — **Дальний слух** — 1 — lowest_hp atk 4  
3. muzzle — **Град капель** — 2 — all_enemies atk 3  
4. headwear — **Обруч прилива** — 1 — all_enemies atk 2 · bleed 1  
5. back — **Волна стрел** — 2 — all_enemies atk 3 · weak 1  
6. tail — **Стрела-якорь** — 1 — nearest atk 5  

### Ranger Wind — mark + pierce
1. eyes — **Метка ветра** — 1 — mark enemy · atk 3  
2. ears — **Слух цели** — 1 — marked/lowest atk 4 ambush  
3. muzzle — **Пронзающий свист** — 1 — atk 5 pierce  
4. headwear — **Перо следопыта** — 1 — backline atk 4 pierce  
5. back — **Стрела-шквал** — 1 — backline atk 5 pierce · mark  
6. tail — **Финальный свист** — 1 — lowest_hp atk 5 · pierce  

### Mage Fire — AoE burst
1. eyes — **Пламенный зрачок** — 1 — atk 4 · vuln 1  
2. ears — **Треск искр** — 1 — atk 3 crit · weak 1  
3. muzzle — **Огненный шар** — 2 — all_enemies atk 3 · vuln 1  
4. headwear — **Корона углей** — 1 — atk 4 · weak 1  
5. back — **Волна жара** — 2 — all_enemies atk 3 crit  
6. tail — **Искра дожатия** — 1 — nearest atk 5  

### Mage Water — control freeze
1. eyes — **Ледяной взор** — 2 — atk 3 · stun 1  
2. ears — **Холодный слух** — 1 — atk 3 · weak 2  
3. muzzle — **Морозный укус** — 1 — atk 4 · stun 1  
4. headwear — **Корона льда-воды** — 1 — all_enemies atk 2 · weak 1  
5. back — **Буря льда** — 2 — all_enemies atk 2 · stun 1 primary  
6. tail — **Стылый хвост** — 1 — atk 4 · weak 1  

### Mage Wind — hybrid bolt
1. eyes — **Взор молнии-ветра** — 1 — atk 4 · weak 1  
2. ears — **Слух грозы** — 1 — atk 3 · stun 1  
3. muzzle — **Разряд** — 1 — atk 5  
4. headwear — **Обруч шквала** — 1 — all_enemies atk 2  
5. back — **Цепной порыв** — 2 — atk 5 primary · atk 2 splash all  
6. tail — **Хвост-разряд** — 1 — backline atk 4 · weak 1  

### Support Fire — heal + smite
1. eyes — **Целительный жар** — 1 — heal 5 ally_lowest_hp  
2. ears — **Тёплый слух** — 1 — heal 3  
3. muzzle — **Поцелуй угля** — 1 — heal 4  
4. headwear — **Корона заботы** — 1 — heal 4 · cleanse 1  
5. back — **Волна тепла** — 2 — heal 2 ally_all  
6. tail — **Праведный ожог** — 1 — atk 4 nearest · heal 2 self  

### Support Water — heal + cleanse
1. eyes — **Целительный взгляд** — 1 — heal 5 ally_lowest_hp  
2. ears — **Уши очищения** — 1 — heal 3 · cleanse 2  
3. muzzle — **Капля жизни** — 1 — heal 4  
4. headwear — **Чистый родник** — 1 — heal 4 · cleanse 1  
5. back — **Волна опеки** — 2 — heal 2 ally_all · cleanse 1  
6. tail — **Очищающий удар** — 1 — atk 3 · cleanse self/ally  

### Support Wind — heal + buff
1. eyes — **Вдохновляющий взор** — 1 — ATK buff +2 / 2 хода ally  
2. ears — **Шёпот ветра** — 1 — heal 3 · weak on enemy 1  
3. muzzle — **Дыхание силы** — 1 — heal 3 · small ally shield 2  
4. headwear — **Лента попутного** — 1 — heal 4  
5. back — **Попутный шквал** — 2 — heal 2 ally_all · ATK buff +1  
6. tail — **Добивающий порыв** — 1 — atk 5 lowest_hp · weak 1  

---

## 7. Batch generation instructions (для агента / Mythfel / Stitch)

1. Для каждого `heroId` взять chrome element + breed block + class face.  
2. Сгенерировать **6** карт по таблице §6; не менять layout chrome.  
3. Выход: `docs/attack-cards-elven-preview/{heroId}/attack_{role}_{element}_{part}.jpg`  
4. Параллельно JSON-манифест строки:
   `cardId, heroId, part, name_ru, cost, atk, shield, heal, hits, targetRule, tags[], desc_ru`  
5. После approve — перенос в `client/web-hud/public/stitch-assets/attack-cards/` и content retune `D-035`.  
6. **Не** заменять D-045 tavern chrome, пока compose не переключён на elven pack.  
7. PvP gate: симулятор mirror 3v3 (все комбинации tank×DPS×support по стихиям) — winrate band ±2% до merge playable numbers.

---

## 8. Forbidden

- Пустое art-window / серый плейсхолдер на финальных картах  
- Разный орнамент chrome между картами одной стихии  
- Латинские filename-watermark на лице карты  
- Life-steal / full heal to max в PvP китах  
- Один и тот же face/action на всех 6 картах героя  
- Перекос: танк без taunt; саппорт без heal; маг без control/AoE идентичности  

---

## 9. One-shot prompt (вставить целиком в новую сессию)

```text
You are generating the FULL attack-card set for «Мифиус: Мифические котики».

Scope: 18 heroes (6 classes × fire/water/wind) × 6 parts (eyes,ears,muzzle,headwear,back,tail) = 108 filled cards.

Chrome: use approved elven frames card_frame_fire / card_frame_water / card_frame_wind (empty grey art window is ONLY for template — final cards MUST paint skill art inside).

Balance bible:
- PvP equal: any tank + any DPS + any support must be mirror-fair (±5% kit power, ±2% sim winrate target).
- Tank triad: fire = taunt+damage; water = taunt+pierce+damage; wind = taunt+reflect.
- Other classes: one ST/ranged focus, one mass/AoE, one hybrid/special (see archetype tables).
- Build rich synergies (vuln→burst, freeze→execute, mark→hunter, cleanse after boss taunt-stun, buff windows, poison spread) that matter in PvE without breaking PvP.
- Deck N=6; cost mostly 1 with 1–2 cost-2 signatures; tags/targetRules from game SSOT.

For EACH card output:
1) image (filled elven card: art + RU title + short RU desc + cost + class plate + relevant effect tabs)
2) manifest row (cardId, numbers, targetRule, tags)

Follow docs/stitch-prompts-attack-cards-elven-18x6.md sections 1–6 exactly. Generate hero-by-hero, show 6 previews per hero for approval before the next hero.
```
