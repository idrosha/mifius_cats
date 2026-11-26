# Stitch-промпты — wireframe-формы (для вставки)

**Как пользоваться:** §0 один раз → дальше **один экран = один промпт** (блок в \`\`\` целиком).  
**Вёрстка всех форм:** landscape **16:9**; блоки **заполнены без пустот**; **без site-footer / подвала**; один flush-уровень; русский UI.  
**Не генерировать заново (уже в HUD):** trade_hub, battle_hub, gear/склад, practice lobby, practice_fight, victory_hall, login, hub, home/персонаж, collection, heroes, codex, breeding.

---

## 0. Global (вставить первым)

```
Game UI for «Мифиус: Мифические котики» (Mythfel) — turn-based 3v3 card battler with mythic cats.

Art: classic early Axie painted 2D, warm fairy-tale tavern hearth — NOT crypto/NFT, NOT kindergarten cute, NOT Axie blob cats (must look like cats).
Palette: warm gold/ember accents on dark stone (#161310 surfaces, #fdba45 primary).
Layout hard rules for EVERY screen: landscape 16:9 game stage; panels flush and fully filled — no empty voids, no website footer, no floating orphan islands; one composition level.
Typography: readable game UI (Rubik/Nunito-like), Russian labels.
Generate one polished screen per prompt.
```

---

## 1. Мифмир · PvE start (`yard`)

```
Screen — Мифмир (PvE campaign start), landscape 16:9.

Left ~60%: campaign map as labeled node blocks (5 nodes), each shows name + wave status 1/2/3 — painted scenic OK but nodes must be clear UI plaques, not tiny dots.
Right ~40%: selected node mission list — Wave 1 small / Wave 2 medium / Wave 3 pitboss + CTAs «Расстановка» and gold «В БОЙ».
Bottom strip: formation preview 3 slots (tank → fighter → backline) flush full width.
No site footer. Brand feel: Мифиус tavern hearth. Russian UI.
```

---

## 2. Строй (`formation`)

```
Screen — Строй отряда (inline pre-battle lineup), landscape 16:9. NOT a menu tab.

Three equal columns: (1) my 3 unit slots with HP/role, (2) center VS + match load progress bar + CTAs «В бой» / «К карте» / «В Таверну», (3) enemy 3 slots.
Blocks fill the stage edge-to-edge. No footer. Warm dark panels, gold CTA. Russian UI.
```

---

## 3. Бой shared HUD (`battle`)

```
Screen — shared fight HUD, landscape 16:9.

Top bar: РАУНД · energy pips · turn timer.
Middle: three zones — allies | arena field | enemies (HP bars readable).
Bottom: hand of 4 cards + primary button «ЗАВЕРШИТЬ ХОД» (+ muted Surrender).
No global website chrome inside the mock. Filled, flush, classic Axie-like clarity. Russian UI.
```

---

## 4. Победа (`result_win`)

```
Screen — Victory result template, landscape 16:9.

Large title «Победа», mode badge, XP + loot as solid info blocks (not sparse).
CTA row: «Ещё бой» / «Расстановка» / «В Хаб».
Reusable for Mythmir/PvP/Dungeon — change badge only. No footer void. Russian UI.
```

---

## 5. Данжи start (`boss_dungeon`)

```
Screen — Данжи start, landscape 16:9.

Left: dungeon list with key counts.
Right: 3-wave preview (~6 / ~10 / boss+4) + CTA into formation.
Must NOT look like a 12-cat raid. Dense panels, no empty stage. Russian UI.
```

---

## 6. Рейд / легион 12 (`boss_raid`)

```
Screen — Raid / Legion 12 start, landscape 16:9.

Large grid of up to 12 cat slots (filled/empty states clear).
Side card: boss name, party size 3–12, lobby status, CTA «Вступить в рейд».
Different from 3-wave dungeon. No footer. Russian UI.
```

---

## 7. PvP Арена (`pvp`)

```
Screen — PvP ranked arena start, landscape 16:9.

Left: my rank / tickets / battle-merit.
Right: matchmaking panel (cross-play pool) + CTAs «В поиск» / «Расстановка».
Full form even if gated tip exists. Warm arena vibe, no crypto. Russian UI.
```

---

## 8. Зал Гильдии (`guild`)

```
Screen — Зал Гильдии / Орден, landscape 16:9.

Three columns: (1) order name/rank/season goal, (2) member list with contribution, (3) actions Технологии / Казна / Бой гильдий.
Hall interior painted OK as background; UI blocks flush filled. Russian UI.
```

---

## 9. Бой гильдий lobby (`guild_battle`)

```
Screen — Guild war lobby (GvG), landscape 16:9.

Party size picker 3 / 6 / 12, lobby slots, CTAs search / formation / hub.
Same visual language as guild hall. No empty footer band. Russian UI.
```

**Live fight (осада · ворота + башни):** отдельный промпт → [`docs/stitch-prompts-guild-siege-fight.md`](stitch-prompts-guild-siege-fight.md) — не путать с этим лобби.

---

## 10. Боевой пасс (`pass`)

```
Screen — Боевой пасс «Лапы Судьбы» / Сезонный Пропуск, landscape 16:9.

Season tab «СЕЗОН», level + XP + ×2 ACTIVE switch.
Horizontal reward track boxes R1–R8 with claim, button «Забрать всё».
Optional small autofarm/autocraft perk strip (meaning only). No website footer. Russian UI.
```

---

## 11. Чаты ×3 (`chat_global` / `chat_guild` / `chat_friends`)

```
Screen — Chats (ONE layout reused for Общий / Гильдия / Друзья), landscape 16:9.

Left/main: message stream + input + dice button.
Right: player inspector card (name, level, BM, status).
Only channel label changes between the three screens. Dense tavern chat vibe. Russian UI.
```

---

## 12. Таверна (`tavern`)

```
Screen — Таверна milk bar, landscape 16:9.

«Барная Карта»: молоко со льдом (post-fight heal), Хрустящая Мышка + PvE/dungeon buff drinks only — NO crafter potions.
Status block HP/energy + quick heal CTA + link to formation.
Warm inn interior, filled panels, no footer. Russian UI.
```

---

## 13. Магазин (`shop`)

```
Screen — Магазин / donate lavka, landscape 16:9.

Wallet (battle coins) + catalog grid: Ларец, Семя Стихий, Боевой Пасс, Серая Броня, 12 common cats (2 per class).
Clear product cells with prices; painted icons OK. Buy selected CTA. No empty margins. Russian UI.
```

---

## 14. Рынок (`market`)

```
Screen — Рынок tools/seeds, landscape 16:9.

Buy: Лопата / топор / Кирка / «Семена для Двора».
Quick-sell loot panel with selected count, revenue, wallet.
Resource-market feel, filled grid, no footer. Russian UI.
```

---

## 15. Аукцион (`auction`)

```
Screen — Player auction house, landscape 16:9.

Category filters + live lots list (cats/armor/weapons/ingredients) + tabs «Мои ставки» / «Мои продажи» + «Выставить лот».
Dense trading UI, no sparse voids. Russian UI.
```

---

## 16. Рейтинги (`rating_players` / `rating_guilds`)

```
Screen — Leaderboard «Таблица Лидеров · Топ-100», landscape 16:9. Same layout twice (players vs guilds).

Left: season/region filters. Right: even column table ranks + BM.
Minimal chrome, flush grid. Russian UI.
```

---

## 17. Сеты брони (`armor_sets`)

```
Screen — Armor sets atlas (База знаний), landscape 16:9.

Filters Все/Есть/Закрыто, set list, inspector with 2-piece / 4-piece bonuses.
Knowledge-book vibe; panels filled. Russian UI.
```

---

## 18. Классовые сеты (`class_sets`)

```
Screen — Class sets (База знаний), landscape 16:9.

Even 2×3 or 3×2 grid for roles: Танк, Боец, Ассасин, Стрелок, Маг, Саппорт — each cell name + set bonus slots.
No empty stage. Russian UI.
```

---

## 19. Крафт (`craft`)

```
Screen — Craft & alchemy, landscape 16:9.

Recipe list + craft bench (chance, cost, «Скрафтить» / ×5).
May show gated tip, but layout still fully filled. Workshop feel. Russian UI.
```

---

## 20. Двор / угодья (`soon_farm`)

```
Screen — Двор (manor estates), landscape 16:9. NOT isometric empty map voids.

Three flush columns: (1) Анбар resources/hour list, (2) production node cards with Collect CTAs, (3) action panel Plant/Hire/Repair/Autofarm/Market.
Bottom actions are part of the form — no separate website footer. Russian UI. Soft-launch may mark deep actions Soon.
```

---

## Чеклист перед Export
1. 16:9 landscape, edge-to-edge stage  
2. No empty brown voids / no site footer  
3. Russian labels match titles above  
4. One screen per Stitch generation  
5. Public share or Download All zip for HUD import
