# Stitch → Web HUD screen map

Sources: vendored `design/stitch-src/*.html` (Project store zips + stubs).
Build: `node client/web-hud/scripts/build-stitch.mjs` → embeds **actual Stitch body HTML** + Tailwind config into `public/index.html`.

## Naming remap (Stitch bugs)

| Stitch export / old label | Actual content | Route / view |
|---|---|---|
| `pve_12` titled «Бой PvE (12 котиков)» | Boss/raid **легион 12** vs Генерал Дог | `boss_raid` → `viewBossRaid` |
| `formation` (nav sometimes «Рейд на Дога») | **PvE 3v3** строй | `formation` → `viewFormation` |
| «Двор» / «Двор Усадьбы» | PvE campaign map | `yard` → `viewYard`, UI label **Мифмир** |

## Coherent nav graph

| Screen id | View id | Source file | Notes |
|---|---|---|---|
| hub | viewHub | hub.html | brand → hub |
| yard | viewYard | yard.html | **Мифмир** PvE map (бывш. Двор) |
| formation | viewFormation | formation.html | PvE / PvP **3v3** строй |
| boss_raid | viewBossRaid | boss_raid.html | from zip `pve_12`; рейд/легион |
| battle | viewBattle | battle.html | 3v3 combat HUD |
| result | viewResultWin / Lose | result_*.html | |
| collection | viewCollection | collection.html | |
| shop | viewShop | shop.html | пасс + донат офферы |
| market | viewMarket | shop.html (auction tab) | рынок зелий/свитков (stub lots) |
| tavern | viewTavern | tavern.html | |
| pvp | viewPvp | pvp.html | |
| pass | viewPass | pass.html | |
| soon_farm | viewSoonFarm | soon_farm.html | ферма «Скоро» |
| soon_clan | viewSoonClan | soon_clan.html | клан-босс «Скоро» |
| gear / home / craft / breeding | view* | `*.html` stubs | **нужен мок Stitch** |
| auction | viewAuction | auction.html stub | |
| guild | viewGuild | guild.html stub | → своя гильдия |
| chat_* | viewChat* | stubs | общий / гильдия / друзья |
| rating_* | viewRating* | stubs | игроки / гильдии |

## App chrome IA

Единый `#appNav`: **primary tabs + subtabs**. Stitch per-screen header nav **скрыт** (двойная полоса / double-nav bug).

См. Project store `docs/nav-ia.md`.

## Integration notes

- Stitch markup is **not** re-implemented in hand CSS. Tokens + Tailwind config come from Stitch `code.html`.
- `#wireDock` adds unique HUD control IDs (battle/devapi smoke) without replacing Stitch layout.
- Stitch `a[data-path]` → `navigate()` via soft map in `app.js` (`рейд-на-дога` → `boss_raid`, `бой-3v3` → `formation`).
- Combat authority remains `battle/devapi` stateDiff only.

## Soft-launch constraints (FULL-SPEC §1 / §6)

- Playable: Hub, Мифмир→Formation→Battle, PvP smoke, Collection, Shop, Pass, Tavern, Market stub, Boss raid mock.
- Farm / Nursery / Clan boss = Soon sheets / stubs only.
- Missing Stitch art → stub routes with clear «нужен мок Stitch» (task list in Project store).
