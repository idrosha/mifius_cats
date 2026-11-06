# Stitch screen map — packs 0268 + 64d5 + e608 + 4da7 + 18c7 + ba17 + 17eb + 1b5c

Sources:
- `media/stitch-new-0268/stitch_mythfel_mobile_game_ui_0268.zip`
- `media/stitch-new-0268/stitch_mythfel_mobile_game_ui__1__64d5.zip`
- `media/stitch-battles-2/stitch_mythfel_mobile_game_ui__2__e608.zip`
- `media/stitch-battles-2/stitch_mythfel_mobile_game_ui__3__4da7.zip`
- `media/stitch-battles-3/stitch_mythfel_mobile_game_ui__5__18c7.zip`
- `media/stitch-battles-6/stitch_mythfel_mobile_game_ui__6__ba17.zip`
- `media/stitch-other-7/stitch_mythfel_mobile_game_ui__7__17eb.zip`
- `media/stitch-registration-1b5c/stitch_mythfel_mobile_game_ui_1b5c.zip` (login replacement)

DESIGN.md = theme **Tavern Hearth Battler** (shared tokens).

## Wired (painted → `design/stitch-src`)

| Route | File | Pack folder | Notes |
|---|---|---|---|
| `hub` | `hub.html` | 0268 `hub_portals_alt` (etalon portals; was `_1` card catalog) | Главный Хаб · 8 порталов + `#appNav` IA |
| `login` | `login.html` | **1b5c** (flat `code.html`) | Вход / Регистрация / Войти в Таверну · bg=`login-hero.png` (not hub.png) |
| `collection` | `collection.html` | 0268 `_3` | Коллекция котиков |
| `armor_sets` | `armor_sets.html` | 0268 `_4` | Атлас сетов брони |
| `gear` | `gear.html` | 0268 `_5` | Кузница / Оружейная |
| `class_sets` | `class_sets.html` | 0268 `_6` | Классовые сеты |
| `home` | `home.html` | 0268 `_7` | Дом Хранителя: кот + экип + инвентарь (no portals — Stitch header nav killed) |
| `breeding` | `breeding.html` | 64d5 `_1` | Питомник / скрещивание |
| `craft` | `craft.html` | 64d5 `_2` | Крафт & алхимия |
| `codex` | `codex.html` | 64d5 `_3` | Кодекс Мифмира |
| `heroes` | `heroes.html` | 64d5 `_4` | Кодекс боевых архетипов |
| `soon_farm` / `farm` | `soon_farm.html` | 64d5 `_5` | Двор / угодья (Soon gameplay) |
| `yard` | `yard.html` | e608 `pve` | Мифмир start: карта + узлы + волны; строй tip inline |
| `formation` | `formation.html` | e608 `versus_3v3` | Строй 3v3 **inline** (не вкладка Бои) |
| `battle` | `battle.html` | e608 `pve_3v3` | Shared fight UI (рука / HP / ход) |
| `result_win` | `result_win.html` | e608 root | Shared victory template |
| `boss_dungeon` | `boss_dungeon.html` | 4da7 `3` | Данжи start · 3 волны |
| `boss_raid` | `boss_raid.html` | 4da7 `12` | Рейд / легион 12 start |
| `pvp` | `pvp.html` | 4da7 `pvp` | PvP Арена start · подбор |
| `guild_battle` | `guild_battle.html` | 4da7 root | Война гильдий lobby / башни |
| `practice` | `practice.html` | 18c7 `3v3_hud` | Тренировка **fight** (додзё 3v3 vs манекены); start/win/lose ещё нет |
| `guild` | `guild.html` | 18c7 `_1` | Зал гильдии (главная) |
| `pass` | `pass.html` | ba17 `4` | Боевой пасс · сезон / трек / claim |
| `chat_global` | `chat_global.html` | ba17 root | Чаты · одна компоновка (общий) |
| `chat_guild` | `chat_guild.html` | ba17 root | Чаты · та же компоновка (гильдия) |
| `chat_friends` | `chat_friends.html` | ba17 root | Чаты · та же компоновка (друзья) |
| `tavern` | `tavern.html` | 17eb `pve` | Таверна · молоко со льдом + PvE бафф-напитки |
| `shop` | `shop.html` | 17eb `_2` | Магазин · донат / пасс / ингредиенты / 12 котов / серая броня |
| `market` | `market.html` | 17eb `_3` | Рынок · инструменты / семена / скупка |
| `auction` | `auction.html` | 17eb `_4` | Аукцион · лоты игроков |
| `rating_players` | `rating_players.html` | 17eb `_5` | Рейтинг · игроки (одна компоновка ×2) |
| `rating_guilds` | `rating_guilds.html` | 17eb `_5` | Рейтинг · гильдии (та же компоновка) |

## Art-only (not separate routes)

| Ref | Path |
|---|---|
| Hub screenshot | `stitch-ref/0268/hub.png` |
| Collection | `stitch-ref/0268/collection.png` |
| Gear | `stitch-ref/0268/gear.png` |
| Home | `stitch-ref/0268/home.png` |
| Hub portals alt HTML | `stitch-ref/0268/hub_portals_alt.html` (not wired — old portal hub) |
| Heroes | `stitch-ref/64d5/heroes.png` |
| Farm | `stitch-ref/64d5/farm.png` |
| Breeding altar | `stitch-ref/64d5/breeding_altar.png` |
| Cat portrait | `stitch-ref/64d5/cat_portrait.png` |
| Farm map | `stitch-ref/64d5/farm_map.png` |
| Yard / battle / formation / win | `stitch-ref/e608/*.png` |
| Arena / victory hall / poster BGs | `stitch-ref/e608/arena_*.png`, `victory_hall.png`, `battle_poster.png` |
| Dungeon / raid / pvp / guild lobby | `stitch-ref/4da7/*.png` |
| Guild fight HTML+PNG | `stitch-ref/4da7/guild_fight.*` (GvG fight art; live fight uses shared `battle`) |
| Guild members / tech / treasury | `stitch-ref/18c7/guild_{members,tech,treasury}.{html,png}` (+ art PNGs) |
| Practice fight screenshot | `stitch-ref/18c7/practice.png` |
| Pass / chat screenshots | `stitch-ref/ba17/pass.png`, `chat.png` |
| Pass reward sanctum art | `stitch-ref/ba17/pass_sanctum.png` |
| Trade hub (4 locations) | `stitch-ref/17eb/trade_hub.{html,png}` — art-only; live routes = tavern/shop/market/auction |
| Tavern map art | `stitch-ref/17eb/tavern_map.png` |
| Trade / rating screenshots | `stitch-ref/17eb/{tavern,shop,market,auction,rating}.png` |

## Working transition forms (HUD-owned)

| Route | File | Notes |
|---|---|---|
| `result_lose` | `result_lose.html` | Shared defeat + CTAs |
| `equip_cards` | `equip_cards.html` | Live equip/unequip + stats (local stub) |
| `soon_clan` | `soon_clan.html` | Create/add/remove clan members; clan-boss tip Soon |

§7 soft gaps: practice **start / win** art; per-mode fight/win skins for Mythmir / PvP / dungeon / raid / GvG (shared fight + win/lose work).

## Nav prefs (2026-11-05)

- Primary **Дом Хранителя**; sub `home` = **Персонаж** (cat + equip + inventory).
- `formation` inline before fights — **not** a Бои subtab.
- Home: no on-screen portals (chrome `#appNav` only).
- Chats: one Stitch layout wired to all three channel subtabs.
- Ratings: one Stitch layout wired to players + guilds subtabs.
- Trade hub mock is art-only; primary Торговля opens first subtab (`tavern`).

## Layout rule (all forms)

Andrew / preferences: **landscape**; **same form size** (`#app` 16:9 stage); **blocks filled** (no empty holes); **single flush level**.  
Shell: `data-layout="landscape"` + `.mythfel-form` on every view; CSS `--mythfel-form-ratio`.
