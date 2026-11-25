# Skill: content

Cards/parts/potions JSON. FULL-SPEC §2 §5.1 §10.
- Roles (6): tank, fighter, assassin, mage, ranger, support. Elements (6): fire/water/grass/bolt/stone/ice.
- ≥8 card parts per role; starters tank·stone, fighter·fire, support·water.
- Soft launch shop: **18** common cats = 6 classes × 3 elements (fire/water/wind); each own **6-card kit** (`shop_{role}_{element}`) → **108** attack cards (`D-059`).
- Nursery mythic (§0, §4.4.1): small chance; mythic deck = **N=6** strongest from parent mix (server SoT Phase 6).
- Equal decks (§2.1, §5.1): fixed starter templates/parts/cards for all new accounts (fair PvP); no RNG starter variants.
- Potion catalog SL: 6 ids in §10; grant ×1 each at registration.
- Farm-cat template `starter_farm_grass` (inventory only on SL).
- Short RU+EN name_keys; effect ≤140 chars RU.
- eyes/ears/muzzle/headwear/back/tail = active attack cards (N=6).
- Formation/targeting (§2.1, §3.4): default attacks use `nearest` (front lane, then role rank).
  Across roles, ship ≥1 attack with `targetRule: "backline"` + tag `backline` (тыл/саппорт).
  Tags: `crit` (×2), `pierce` (ignore shield), freeze→`stun`. Player numbers: `docs/game-wiki.md`.
Do not invent a 7th role or 7th element; no starter pendant/bow.
