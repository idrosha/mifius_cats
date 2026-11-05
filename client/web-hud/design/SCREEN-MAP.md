# Stitch → Web HUD screen map

Sources: vendored `design/stitch-src/*.html` (Project store zips `stitch-ui-new` 2a9f + 940b + 3a8d + packs **8/9/10**).
Build: `node client/web-hud/scripts/build-stitch.mjs` → embeds **actual Stitch body HTML** + Tailwind config into `public/index.html`.

## Local art (required)

Stitch LH3 hosts are **not** used at runtime:

| Kind | Path | Notes |
|---|---|---|
| `aida-public` JPEGs | `public/stitch-assets/*.jpg` | vendored by `scripts/vendor-stitch-assets.mjs` |
| Ephemeral `/aida/` (returns HTML) | replaced with `stitch-ref` / hero PNGs | login, gear, auction, breeding, equip |
| Screen.png refs | `public/stitch-ref/**` (from `design/stitch-ref`) | scenic shells (codex/yard bg, fallbacks) |

Re-vendor after adding Stitch HTML with remote images: `node client/web-hud/scripts/vendor-stitch-assets.mjs` then `build-stitch.mjs`.

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
| login | viewLogin | login.html | Boot→Login (3a8d `_3`) |
| practice | viewPractice | practice.html | Тренировочный лагерь (3a8d `_1`) |
| codex | viewCodex | codex.html | Кодекс Мифмира (3a8d `_2`) |
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
| home | viewHome | home.html | **Дом Хранителя** (pack 8 landscape) |
| heroes | viewHeroes | heroes.html | Кодекс героев · 12 архетипов (pack 8/`12`) |
| armor_sets | viewArmorSets | armor_sets.html | Атлас сетов брони (pack 8/`1_8`) |
| class_sets | viewClassSets | class_sets.html | Арсенал классовых сетов (pack 9) |
| equip_cards | viewEquipCards | equip_cards.html | Карточки экипировки 8 рангов (pack 10/`8`) |
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

- Playable: Hub, Мифмир→Formation→Battle, PvP smoke, Collection, Shop, Pass, Tavern, Market, Auction, Boss dungeon→raid, Chats, Ratings, Guild home mock, Craft/Breeding mocks, Home/Heroes/equip forms (packs 8/9/10).
- Farm / Clan boss gameplay = Soon sheets.
- **Дом (`home`)** — pack 8 landscape (gap closed).
- Runtime art: `/stitch-assets/` + `/stitch-ref/` only (no remote LH3).

## Pack 8 / 9 / 10 → routes

| Zip | Folder | Form | Route |
|---|---|---|---|
| 8 `__5c8a` | `landscape` | Дом Хранителя | `home` |
| 8 | `12` | Кодекс котиков-воителей (12 архетипов) | `heroes` |
| 8 | `1_8` | Атлас сетов брони | `armor_sets` |
| 8 | `8` | Кодекс карточек снаряжения (overview art) | ref only `equip_codex` |
| 9 `__0aa8` | root | Арсенал классовых сетов | `class_sets` |
| 9 | sample tank armor PNG | art-only | `stitch-ref/8-9-10/equip_tank.png` |
| 10 `__1f5f` | `8` | Карточки экипировки · 8 рангов | `equip_cards` |
| 10 | sample void weapon PNG | art-only | `stitch-ref/8-9-10/weapon_void.png` |

## Soft-launch content (2026-11-04)

1. Мифмир: карта + список миссий (`mythmirMissionList`); 5 stages × 3 fights in `content/stages/mythmir_*` + `content/campaign/mythmir_sl.json`.
2. Practice wins + PvE wins unlock PvP at `limits.pve_unlock_n` (default 3).
3. Shop: 8 `common_cat` offers (2 variants × 4 roles).
4. Tavern: milk restore only; potions → market/auction.
5. First boss: `boss_first_w1..w3` on dungeon screen.
6. Gated forms tip: «Подними ранг в боях».
