# Stitch — экран боя осады гильдий (`guild_siege_fight`)

**Статус:** draft prompt (презентация). Механика = `FULL-SPEC` §4.5 · `D-064` · `D-065` · `D-066`.  
**Главный бой осады:** **12 vs 12**. 3/6 — только лобби/быстрые форматы, не этот экран.  
**Таргет (`D-065`):** башни бьют только лучники/маги; мили на стену не прыгает.  
**Борд (`D-066`):** один 16:9 overview — все 24 видны; **без** horizontal scroll / ultra-wide.  
**Связь:** лобби = `guild_battle`; этот промпт = **live fight** осады.  
**Не путать:** клан-босс (§4.4), рейд/легион PvE, обычный 3v3 PvP.

**Как пользоваться:** сначала §0 Global из `docs/stitch-prompts-wireframe-forms.md`, затем блок §1 целиком в Stitch.

---

## 0. Visual brief (для агента / дизайна)

| Сторона | Фон | Строй / слоты | Масштаб |
|---|---|---|---|
| **Слева · атака (12)** | Подход / дорога к замку | **Слева→направо:** саппорты → DPS (маги/лучники/убийцы/бойцы) → **танки** (ближе к центру/мосту) | Маленькие full-body; **hover/focus → enlarge** для прицела карты |
| **Справа · защита (12)** | Мост к замку + стены + башни | **Ворота/мост (6):** танки+бойцы; **башни 3+3:** маги/лучники | Маленькие full-body cutouts (не портретные карточки) |
| **Центр** | Полоса штурма / убийственное поле | Между клином атаки и мостом | Пустое игровое «поле» без UI-карточек |
| **Победа** | — | Clear всех 12 | Milestone «Ворота пробиты» = 6 у ворот мертвы |

Facing: атака смотрит **вправо** (на замок); защита смотрит **влево** (`D-047`).  
HUD: shared fight tray (рука + справа ЗАВЕРШИТЬ ХОД).

---

## 1. Промпт Stitch (вставить целиком)

```
Screen — Guild Siege LIVE FIGHT (осада), landscape 16:9. Game «Мифиус: Мифические котики» (Mythfel).
Warm painted fairy-tale battler (Tavern Hearth Battler): dark stone #161310, gold #fdba45. NOT crypto/NFT, NOT Axie blob cats, NOT kindergarten cute.

ONE 16:9 composition — ALL 24 cat heroes visible at once (12 attackers LEFT + 12 defenders RIGHT). No horizontal scroll, no ultra-wide, no website footer, no empty voids, no floating promo badges (`D-066`).

════════════════════════════════════
LEFT HALF — ATTACKERS (штурм)
════════════════════════════════════
BACKGROUND: siege APPROACH to the castle — dirt/stone road, siege dust, banners, distant battlements on the right edge of this half. This is the road TO the fortress, not a flat PvP arena.

EXACTLY 12 assault cats as SMALL full-body cutouts (no rectangular portrait cards, no framed hero plates). Compact HP bar + tiny role pip on each.

FORMATION COLUMN — left → right (rear → front toward the castle):
1) LEFTMOST (тыл): Supports — healers/buffers.
2) MIDDLE: DPS — mages, rangers/archers, assassins, fighters.
3) RIGHTMOST of the left half (ближайшие к мосту/центру): Tanks — biggest silhouettes in the assault line.
All attackers FACE RIGHT (toward the castle).

HOVER / FOCUS UX (show in the mock):
- Default: small overview scale so all 12 fit.
- One unit shown in HOVER/SELECTED state: clearly ENLARGED (focus pop) with stronger highlight glow — this is how the player aims a card / inspects a unit.
- Other units stay small. Do NOT scroll the board to focus.

════════════════════════════════════
RIGHT HALF — DEFENDERS (гарнизон замка)
════════════════════════════════════
BACKGROUND: stone BRIDGE into the castle + WALLS with TWO TOWERS (left-of-gate and right-of-gate from viewer) + portcullis/gate. Ember torches, dusk siege smoke. Optional soft treasure gleam in the gate throat (soft currency only — no crypto text).

EXACTLY 12 defender cats as SMALL full-body cutouts (same language as attackers — tiny but FULL HEIGHT figures, not bust portraits, not card frames).

PLACEMENT:
1) BRIDGE / GATE LINE (lower, closer to camera) — exactly 6: Tanks + Fighters only, shield wall on the bridge/gate mouth. Facing LEFT toward attackers.
2) TOWERS (elevated parapets) — exactly 6: 3 on left tower + 3 on right tower. Mages + Rangers/Archers/Shooters only. Facing LEFT. Clearly HIGHER than the gate line.

Compact HP bars on every defender. Gate vs tower height difference must read instantly.

════════════════════════════════════
CENTER + HUD
════════════════════════════════════
CENTER: clear killing-ground strip between assault tanks and the bridge (no units parked in the middle UI chrome).

FACING: left side → right; right/castle side → left (`D-047`).

TOP HUD (thin, Russian UI):
- Left: chip «ОСАДА · 12×12» + “Ворота 6” / “Башни 6”.
- Center: «РАУНД 3» · energy pips · turn timer.
- Right: «Уничтожьте весь гарнизон (12)» + tip «Башни: только лук/магия» + «Казна гильдии» (soft only).

BOTTOM FIGHT TRAY (soft-launch language):
- Hand of 4–6 attack cards (painted plates).
- Right edge pinned: energy + primary «ЗАВЕРШИТЬ ХОД» + muted «Сдаться».
- Tray ≤ ~22% of stage height so all 24 units stay readable.

DO NOT:
- Flat 3v3 PvP lane row (must read as APPROACH vs CASTLE BRIDGE/TOWERS).
- Hide half the legion / paged strips / horizontal scroll.
- Portrait cards or framed inventory-style hero tiles on the board — full-body cutouts only.
- Put supports in front of tanks on the assault side (order is supports → DPS → tanks, left→right).
- Put mages/archers on the bridge gate line, or tanks up on tower parapets.
- Clan-boss shared HP bar, NFT/crypto labels, site nav, footer letterbox, sticker overlays on the art.

Mood: full siege assault — optional battering-ram / dust as background set dressing only.
Typography: Rubik/Nunito-like, bold Russian labels.
Generate one polished filled 16:9 fight screen.
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

- Route/view: `guild_siege_fight` / `#viewGuildSiegeFight` или реюз live-fight HUD + siege backdrop + 12+12 slots — на wire.
- Assault column paint: left→right **support → DPS → tank** (тыл→фронт к замку); facing right.
- Hover/selected enlarge для прицела карты — presentation (`D-066`); SoT таргета — сервер (`D-065` зоны).
- Battle-core 12 + zone filter = §4.5; SL demo 3v3 ≠ этот экран.
- Overview 24-in-frame, no board scroll (`D-066`); phone landscape (`D-036`).
- Idle/facing/silhouette — `D-046` / `D-047` / `D-048` (siege floor плотнее practice).
- Числа HP/наград на макете = paint; SoT — сервер.
