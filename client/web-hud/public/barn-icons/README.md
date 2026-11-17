# Склад /barn card icons (warehouse-icons-v2 + MF-153 farm tools)

Stable root-relative assets for the live warehouse sheet. Do **not** rely on CDN
or stitch vendor downloads — keep these PNGs in-repo under `public/barn-icons/`.

Source packs: project media `warehouse-icons-v2/` (PR #93) and `warehouse-farm-tools/` (MF-153).
DESIGN: `design/stitch-ref/home-keeper/sklad/DESIGN.md` → **Warehouse · Farm resources & tools**.

**Armor / weapon color sets** live under `/gear-sets/` (see `public/gear-sets/README.md`) — not in this folder. Old thunder/wool barn gear ids removed from `app.js`.

## Equip / legacy

| File | Catalog / slot |
|---|---|
| `dagger.png` / `chest.png` / `helmet.png` / `boots.png` / `ring.png` / `collar.png` | legacy leftovers (unused by live catalogs) |
| `guard.png` | Усатый Дозорный (sidebar) |

## Farm resources (wiki §2 · warehouse Soon on SL)

| File | Catalog |
|---|---|
| `wood.png` | Дубовые брёвна |
| `iron.png` | Железо / слитки |
| `stone.png` | Мшистый гранит |
| `fruit.png` | Свежие плоды |
| `seeds.png` | Семена Урожая |
| `veggies.png` | Корзина урожая |
| `fish.png` | Связка рыбы |
| `herbs.png` | Пучок трав |
| `milk.png` | Молоко Очага |

## Tools (Market SKUs · wiki §8.1 · MF-153)

| File | SKU / use |
|---|---|
| `tool-shovel.png` | `tool_shovel` · грядки/сад |
| `tool-axe.png` | `tool_axe` · лесопилка |
| `tool-pick.png` | `tool_pick` · рудник/карьер |
| `tool-rod.png` | удочка · рыбная заводя (+ `bait_basic`) |

## Alchemy / chrome (Soon)

| File | Use |
|---|---|
| `potions.png` | Эликсиры category row |
| `potion-mana.png` / `potion-nature.png` / `potion-ember.png` | Split bottles Phase 6 |
| `seal-paw.png` / `seal-warehouse.png` | Inspect / capacity chrome |

Paths in HUD: `/barn-icons/<file>.png` (served from this folder). HUD thumbs are **256×256**; full 1024 masters stay in project media (`warehouse-icons-v2/`, `warehouse-farm-tools/`).

**SL note (MF-153):** assets + DESIGN OK; do **not** ship live farm/nursery gameplay UI unless Andrew asks.
