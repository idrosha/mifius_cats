# Stitch — экран боя осады гильдий (`guild_siege_fight`)

**Статус:** draft prompt (презентация). Механика = `FULL-SPEC` §4.5 · `D-064` · `D-065`.  
**Главный бой осады:** **12 vs 12**. 3/6 — только лобби/быстрые форматы, не этот экран.  
**Таргет (`D-065`):** башни бьют только лучники/маги; мили на стену не прыгает.  
**Связь:** лобби = `guild_battle`; этот промпт = **live fight** осады.  
**Не путать:** клан-босс (§4.4), рейд/легион PvE, обычный 3v3 PvP.

**Как пользоваться:** сначала §0 Global из `docs/stitch-prompts-wireframe-forms.md`, затем блок ниже целиком в Stitch.

---

## 0. Visual brief (для агента / дизайна)

| Зона | Слоты | Кто стоит | Читать как |
|---|---|---|---|
| **Ворота замка** | **6** защитников | Танки + бойцы (мили) | Доступны melee / nearest |
| **Башни L+R** | **6** (по **3**) | Маги + лучники/стрелки | Бить могут **только** лучники/маги атакующих (`D-065`) |
| **Подступы** | **12** атакующих | Полный штурмовой легион | Клин/два ряда; facing → вправо |
| **Победа** | **12** clear | Весь гарнизон | Milestone «Ворота пробиты» = 6 gate dead |

HUD боя = тот же soft-launch fight tray (рука + справа ЗАВЕРШИТЬ ХОД), не новый chrome.  
Плотность высокая: силуэты читаемые, без портретных рамок; HP-бары обязательны.

---

## 1. Промпт Stitch (вставить целиком)

```
Screen — Guild Siege LIVE FIGHT — the MAIN GvG battle: exactly 12 attackers vs 12 defenders, landscape 16:9 game stage.
Game: «Мифиус: Мифические котики» (Mythfel). Warm painted fairy-tale battler UI (Tavern Hearth Battler). NOT crypto/NFT, NOT Axie blob cats, NOT cute kindergarten.

HARD COUNT: show ALL 24 cat heroes on screen (12 assault + 12 garrison). This is NOT a 3v3 duel and NOT a sparse demo — it is the full siege legion fight.

ONE composition: edge-to-edge siege battlefield as the dominant plane. No website footer, no empty voids, no dashboard cards in the hero area, no floating promo badges.

SCENE — defender castle fills the RIGHT / CENTER-RIGHT of the frame:
- Massive stone gate / portcullis in the LOWER-CENTER of the defender side (closer to camera).
- Two flanking towers (LEFT-of-gate and RIGHT-of-gate from viewer, both elevated) with parapets and warm torch light.
- Distant keep / banners behind; soft ember smoke; dusk / siege atmosphere (gold #fdba45 accents on dark stone #161310).
- Optional small “treasure gleam” inside the open gate throat (soft currency fantasy only — coins/chests silhouette, NO crypto wording).

DEFENDER GARRISON — exactly 12 cats (readable full-body cutouts, NO rectangular portrait frames):
1) GATE LINE — exactly 6 melee cats standing IN / just behind the portcullis (front wall):
   - Tanks and Fighters only. Biggest silhouettes, packed as a shield wall across the gate mouth.
   - Facing LEFT toward the attackers.
   - Each unit: compact HP bar + tiny role mark; still readable at 16:9.
2) TOWER LINE — exactly 6 ranged cats total: 3 on LEFT tower + 3 on RIGHT tower:
   - Mages, Rangers / Archers / Shooters only. Narrower silhouettes than tanks.
   - Standing on parapets ABOVE the gate; facing LEFT toward the field.
   - HP bars visible; clear height difference vs gate line so towers read as “above”.

ATTACKER LEGION — exactly 12 mythic-cat heroes on the LEFT / LOWER-LEFT siege road:
- Full 12-cat assault formation: two short rows or a wide wedge on the approach (front melee + rear ranged/support), all facing RIGHT toward the castle.
- Mix of roles allowed. Same cutout language as other live fights; every cat has an HP bar.
- Leave a clear killing-ground strip between the assault front and the gate (arena field).
- Do NOT hide cats behind UI — all 12 attackers must be countable at a glance.

FACING RULE: left side faces right; right/castle side faces left (toward center).

TOP HUD (thin game chrome, Russian UI):
- Left: mode chip «ОСАДА · 12×12» + status (“Ворота 6” / “Башни 6” alive counts).
- Center: «РАУНД 3» · energy pips · turn timer.
- Right: objective «Уничтожьте весь гарнизон (12)» + tip chip «Башни: только лук/магия» + soft-loot hint «Казна гильдии» (soft only).

BOTTOM FIGHT TRAY (soft-launch fight HUD language):
- Left/main: hand of attack cards (4–6 painted card plates) for the ACTIVE attacker unit/player.
- Right edge pinned: energy / «ЗАВЕРШИТЬ ХОД» primary CTA + muted «Сдаться».
- No centered floating action cluster; tray flush to bottom.
- Tray must not cover more than ~22% of stage height — board needs room for 24 units.

DO NOT:
- Draw a flat 3-lane 3v3 PvP row (must READ as castle: gate wall of 6 + towers of 3+3).
- Show only a subset “hero focus” of the 12 — all slots filled.
- Show clan-boss shared HP bar or raid-only legion grid chrome.
- Add NFT / mint / wallet / crypto labels.
- Add site nav, footer, or empty letterbox bands.
- Overlay detached stickers/badges on the castle art.

Mood: full-scale siege climax — optional distant battering-ram / dust as set dressing only (not widgets).
Typography: Rubik/Nunito-like, bold Russian labels, high contrast on dark stone.
Generate one polished filled 16:9 fight screen with countable 12v12 rosters.
```

---

## 2. Опционально · победа осады (`guild_siege_result`)

```
Screen — Guild Siege victory result, landscape 16:9.
Same Mythfel warm stone/gold language. Title «Цитадель пала». Badge «Осада · 12×12».
Show soft rewards only (fish / scrap / guild medals) + guild score delta.
CTA row: «Ещё штурм» / «К осаде» / «В Хаб». No crypto. No empty footer. Russian UI.
```

---

## 3. Notes для импорта (web-hud later)

- Route/view: отдельно от лобби `guild_battle` — например `guild_siege_fight` / `#viewGuildSiegeFight` (или реюз live-fight HUD + siege backdrop + 12+12 slots). Решать на wire, не в Stitch.
- Battle-core 12 + siege zone target-filter = расширение ядра (§4.5 / `D-065`); SL demo 3v3 ≠ этот экран.
- Cutouts / idle breathe / facing — `D-046` / `D-047` / `D-048`, когда дойдёт до кода.
- Числа HP/наград на макете = paint; SoT — сервер.
