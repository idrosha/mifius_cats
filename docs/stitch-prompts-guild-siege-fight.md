# Stitch — экран боя осады гильдий (`guild_siege_fight`)

**Статус:** draft prompt (презентация). Механика GvG = `FULL-SPEC` §4.5; async-гарнизон пока не Accepted.  
**Связь:** лобби уже есть (`guild_battle`); этот промпт = **live fight**, не лобби.  
**Не путать:** клан-босс (§4.4), рейд/легион PvE, обычный 3v3 PvP.

**Как пользоваться:** сначала §0 Global из `docs/stitch-prompts-wireframe-forms.md`, затем блок ниже целиком в Stitch.

---

## 0. Visual brief (для агента / дизайна)

| Зона | Кто стоит | Читать как |
|---|---|---|
| **Ворота замка** (низ / центр обороны) | Танки + бойцы (мили) | «Стена» — широкие силуэты, ближе к камере |
| **Башни** (лево/право, выше ворот) | Маги + лучники/стрелки (рейндж) | Узкие силуэты на парапете; стреляют вниз |
| **Подступы** (слева / снизу-слева) | Отряд атакующих | Идут на ворота; facing → вправо к замку |
| **Победа** | Убить **всех** защитников (ворота + башни) | Не «сломать дверь отдельно» — clear roster |

HUD боя = тот же soft-launch fight tray (рука + справа ЗАВЕРШИТЬ ХОД), не новый chrome.

---

## 1. Промпт Stitch (вставить целиком)

```
Screen — Guild Siege LIVE FIGHT (GvG assault on a castle), landscape 16:9 game stage.
Game: «Мифиус: Мифические котики» (Mythfel). Warm painted fairy-tale battler UI (Tavern Hearth Battler). NOT crypto/NFT, NOT Axie blob cats, NOT cute kindergarten.

ONE composition: edge-to-edge siege battlefield as the dominant plane. No website footer, no empty voids, no dashboard cards in the hero area, no floating promo badges.

SCENE — defender castle fills the RIGHT / CENTER-RIGHT of the frame:
- Massive stone gate / portcullis in the LOWER-CENTER of the defender side (closer to camera).
- Two flanking towers (LEFT-of-gate and RIGHT-of-gate from viewer, both elevated) with parapets and warm torch light.
- Distant keep / banners behind; soft ember smoke; dusk / siege atmosphere (gold #fdba45 accents on dark stone #161310).
- Optional small “treasure gleam” inside the open gate throat (soft currency fantasy only — coins/chests silhouette, NO crypto wording).

DEFENDER PLACEMENT (guild garrison — readable silhouettes, full-body cat heroes WITHOUT rectangular portrait frames):
1) GATE LINE (front melee wall, 3–6 cats standing IN the gateway / just behind the portcullis):
   - Tanks and Fighters only. Biggest silhouettes. Facing LEFT toward the attackers.
   - Each unit: HP bar + small name/role chip readable at a glance.
2) TOWER LINE (ranged, elevated on BOTH towers, 3–6 cats total split across towers):
   - Mages, Rangers/Archers/Shooters only. Smaller/narrower silhouettes than tanks.
   - Standing on parapets ABOVE the gate; facing LEFT toward the field.
   - HP bars visible; slight height difference vs gate line so towers read as “above”.

ATTACKER PLACEMENT (assault squad, LEFT / LOWER-LEFT approach road toward the gate):
- 3 to 12 mythic-cat heroes in a short assault column / wedge on the siege road and battering approach.
- Facing RIGHT (toward the castle). Mix of roles allowed.
- Same cutout style as other live fights; HP bars readable.
- Leave a clear killing-ground strip between attackers and the gate (arena field).

FACING RULE: left side faces right; right/castle side faces left (toward center).

TOP HUD (thin game chrome, Russian UI):
- Left: mode chip «ОСАДА» + tower/gate status (“Ворота · живы” / “Башни 2/2”).
- Center: «РАУНД 3» · energy pips · turn timer.
- Right: objective line «Уничтожьте весь гарнизон» (kill ALL defenders to win) + small soft-loot hint «Казна гильдии» (soft only).

BOTTOM FIGHT TRAY (must match soft-launch fight HUD language):
- Left/main: hand of attack cards (4–6 painted card plates) for the ACTIVE attacker.
- Right edge pinned: energy / «ЗАВЕРШИТЬ ХОД» primary CTA + muted «Сдаться».
- No centered floating action cluster; tray flush to bottom.

DO NOT:
- Put defenders in a flat 3-lane row like normal PvP (this screen must READ as castle: gate wall + towers).
- Show clan-boss shared HP bar or raid legion grid.
- Add NFT / mint / wallet / crypto labels.
- Add site nav, footer, or empty letterbox bands.
- Overlay detached stickers/badges on the castle art.

Mood: tense assault — battering rams / siege dust optional as background set dressing only (not interactive widgets).
Typography: Rubik/Nunito-like, bold Russian labels, high contrast on dark stone.
Generate one polished filled 16:9 fight screen.
```

---

## 2. Опционально · победа осады (`guild_siege_result`)

Короткий follow-up, если нужен отдельный result (можно реюзать `result_win` + badge).

```
Screen — Guild Siege victory result, landscape 16:9.
Same Mythfel warm stone/gold language. Title «Цитадель пала». Badge «Осада · GvG».
Show soft rewards only (fish / scrap / guild medals) + guild score delta.
CTA row: «Ещё штурм» / «К осаде» / «В Хаб». No crypto. No empty footer. Russian UI.
```

---

## 3. Notes для импорта (web-hud later)

- Route/view: отдельно от лобби `guild_battle` — например `guild_siege_fight` / `#viewGuildSiegeFight` (или реюз `#viewPracticeFight` + siege backdrop + custom unit slots). Решать на wire, не в Stitch.
- Cutouts / idle breathe / facing — те же правила live-fight (`D-046` / `D-047` / `D-048`), когда дойдёт до кода.
- Числа HP/наград на макете = paint; SoT — сервер.
- Пока §4.5 SL: достаточно лобби + tip; этот экран = контент для post-SL / gated flag.
