# Stitch → Web HUD screen map

Sources: vendored `design/stitch-src/*.html` from Project store `internal/stitch-ui/*.zip`.
Build: `node client/web-hud/scripts/build-stitch.mjs` → embeds **actual Stitch body HTML** + Tailwind config into `public/index.html`.

## Coherent nav graph

| Screen id | View id | Source file | Zip origin |
|---|---|---|---|
| hub | viewHub | hub.html | zip4 / zip3 landscape (Главный Хаб) |
| yard | viewYard | yard.html | zip1 landscape_6 |
| formation | viewFormation | formation.html | zip2 formation |
| battle | viewBattle | battle.html | zip1 3v3_landscape |
| result | viewResultWin / Lose | result_*.html | zip2 landscape_1/2 |
| collection | viewCollection | collection.html | zip1 landscape_4 |
| shop | viewShop | shop.html | zip1 landscape_3 |
| market | viewMarket | shop.html (auction) | zip1 landscape_3 |
| tavern | viewTavern | tavern.html | zip1 root |
| pvp | viewPvp | pvp.html | zip1 pvp |
| pass | viewPass | pass.html | zip1 battle_pass |
| soon_farm | viewSoonFarm | soon_farm.html | e4fa / zip3 |
| soon_clan | viewSoonClan | soon_clan.html | zip2 landscape_3 |

## Integration notes

- Stitch markup is **not** re-implemented in hand CSS. Tokens + Tailwind config come from Stitch `code.html`.
- `#wireDock` adds unique HUD control IDs (battle/devapi smoke) without replacing Stitch layout.
- Stitch header `a[data-path]` → `navigate()` via soft map in `app.js`.
- Combat authority remains `battle/devapi` stateDiff only.

## Soft-launch constraints (FULL-SPEC §1 / §6)

- Playable: Hub, Yard→Formation→Battle, PvP smoke, Collection, Shop, Pass, Tavern, Market stub.
- Farm / Nursery / Clan boss = Soon sheets only.
