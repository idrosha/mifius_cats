# Stitch → Web HUD screen map

Sources: vendored `design/stitch-src/*.html` (Project store zips `stitch-ui-new` 2a9f + 940b + prior).
Build: `node client/web-hud/scripts/build-stitch.mjs` → embeds **actual Stitch body HTML** + Tailwind config into `public/index.html`.

## Naming remap (Stitch bugs)

| Stitch export / old label | Actual content | Route / view |
|---|---|---|
| `pve_12` titled «Бой PvE (12 котиков)» | Boss/raid **легион 12** vs Генерал Дог | `boss_raid` → `viewBossRaid` |
| `formation` (nav sometimes «Рейд на Дога») | **PvE 3v3** строй | `formation` → `viewFormation` |
| «Двор» / «Двор Усадьбы» | PvE campaign map | `yard` → `viewYard`, UI label **Мифмир** |

## Pack 2a9f → routes

| Zip folder | Form content | Route |
|---|---|---|
| landscape_1 | Зал Славы и Рейтинги (игроки + гильдии tabs) | `rating_players` / `rating_guilds` |
| landscape_2 | Подземелья и Рейды — выбор данжа | `boss_dungeon` |
| landscape_3 | Рынок знахаря (зелья + свитки крафта) | `market` |
| landscape_4 | Моя гильдия (Орден Золотой Лапы) | `guild` |
| landscape_5 | Чаты: Общий / Гильдия / Друзья | `chat_*` |
| landscape_6 | Инвентарь и Сумка Хранителя | `gear` |
| dungeon entrance PNG | art-only | `design/stitch-ref/2a9f/` |

## Pack 940b → routes

| Zip folder | Form content | Route |
|---|---|---|
| landscape_1 | Аукцион / лоты | `auction` |
| landscape_2 | Святилище Рождения (скрещивание) | `breeding` |
| landscape_3 | Верстак и Алхимия | `craft` |
| nursery / auction hall / alchemy PNGs | art-only | `design/stitch-ref/940b/` |

## Coherent nav graph

| Screen id | View id | Source file | Notes |
|---|---|---|---|
| hub | viewHub | hub.html | brand → hub |
| yard | viewYard | yard.html | **Мифмир** PvE map |
| formation | viewFormation | formation.html | PvE / PvP **3v3** строй |
| boss_dungeon | viewBossDungeon | boss_dungeon.html | выбор данжа **перед** легионом (2a9f) |
| boss_raid | viewBossRaid | boss_raid.html | рейд/легион 12 |
| battle | viewBattle | battle.html | 3v3 combat HUD |
| result | viewResultWin / Lose | result_*.html | |
| collection | viewCollection | collection.html | + starter grant cats |
| shop | viewShop | shop.html | пасс + донат |
| market | viewMarket | market.html | рынок знахаря (2a9f) |
| tavern | viewTavern | tavern.html | |
| pvp | viewPvp | pvp.html | |
| pass | viewPass | pass.html | |
| soon_farm | viewSoonFarm | soon_farm.html | ферма «Скоро» |
| soon_clan | viewSoonClan | soon_clan.html | клан-босс «Скоро» |
| gear | viewGear | gear.html | сумка/инвентарь (2a9f) |
| home | viewHome | home.html | **stub** — TRUE gap |
| craft | viewCraft | craft.html | алхимия (940b) |
| breeding | viewBreeding | breeding.html | питомник (940b) |
| auction | viewAuction | auction.html | аукцион (940b) |
| guild | viewGuild | guild.html | гильдия (2a9f) |
| chat_* | viewChat* | chat_*.html | каналы (2a9f) |
| rating_* | viewRating* | rating_*.html | рейтинги (2a9f) |

## App chrome IA

Единый `#appNav`: **primary tabs + subtabs**. Stitch per-screen header nav **скрыт**.

См. Project store `docs/nav-ia.md`.

## Starter grant smoke

`POST /api/dev/starter` → §5.1 kit (equal decks, potions×1, 1 farm-cat, no gear).  
Backend: `economy.GrantStarterKit` / `NewPlayerWithStarter`.

## Soft-launch constraints (FULL-SPEC §1 / §6)

- Playable: Hub, Мифмир→Formation→Battle, PvP smoke, Collection, Shop, Pass, Tavern, Market, Auction, Boss dungeon→raid, Chats, Ratings, Guild home mock, Craft/Breeding mocks.
- Farm / Clan boss gameplay = Soon sheets.
- **Дом (`home`)** — единственный TRUE gap без мока в 2a9f/940b.
