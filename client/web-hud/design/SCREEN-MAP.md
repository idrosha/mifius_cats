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
| `hub` | `hub.html` | 0268 `hub_portals_alt` (etalon portals; was `_1` card catalog) | Главный Хаб · порталы; chrome `#appNav` (`D-029`); IA order locked `D-033` |
| `login` | `login.html` | **1b5c** (flat `code.html`) | Вход / Регистрация / Войти в Таверну · bg=`login-hero.png` (not hub.png) |
| `collection` | `collection.html` | home-keeper коллекция | Коллекция котиков |
| `armor_sets` | `armor_sets.html` | 0268 `_4` | Атлас сетов брони |
| `gear` | `gear.html` | home-keeper Склад | Склад / амбар |
| `class_sets` | `class_sets.html` | 0268 `_6` | Классовые сеты |
| `home` | `home.html` | home-keeper персонаж | Дом Хранителя: персонаж + экип (chrome `#appNav` only) |
| `breeding` | `breeding.html` | home-keeper скрещивание | Питомник · SL stub `D-030` (form+tip, без live) |
| `craft` | `craft.html` | home-keeper крафт | Крафт & алхимия |
| `codex` | `codex.html` | live `/codex` KB sheet (was 64d5 `_3`) | База знаний · оружейные архетипы |
| `heroes` | `heroes.html` | 64d5 `_4` | Кодекс боевых архетипов |
| `soon_farm` / `farm` | `soon_farm.html` | 64d5 `_5` | Двор / угодья (Soon gameplay) |
| `yard` | `yard.html` | e608 `pve` | Мифмир start: карта + узлы + волны; строй tip inline |
| `formation` | `formation.html` | e608 `versus_3v3` | Строй 3v3 **inline** (не вкладка Бои) |
| `battle` | `battle.html` | e608 `pve_3v3` | Shared fight UI (рука / HP / ход) |
| `result_win` | `result_win.html` | e608 root | Shared victory template |
| `victory_hall` | `victory_hall.html` | victory-practice | Training/Mythmir win · 3 hero cards (cats↔dummies) |
| `boss_dungeon` | `boss_dungeon.html` | 4da7 `3` | Данжи start · 3 волны |
| `boss_raid` | `boss_raid.html` | 4da7 `12` | Рейд / легион 12 start |
| `pvp` | `pvp.html` | 4da7 `pvp` | PvP Арена start · подбор |
| `pvp_load` | `pvp_load.html` | stitch pvp_versus_3v3 + MF-148 figures | Загрузка рейтинговой дуэли 3v3 · `/pvp-load` |
| `pvp_fight` | `pvp_fight.html` | stitch `бой 3на3` / pvp_3v3 | Live PvP 3v3 · cutouts + hand · `#pv*` binds |
| `pvp_victory` | `pvp_victory.html` | stitch victory tavern | Славная победа в Колизее · `data-col` CTAs |
| `guild_battle` | `guild_battle.html` | 4da7 root | Война гильдий lobby / башни |
| `practice` | `practice.html` | practice-dojo-gold + practice-empty-squad | Тренировка lobby · ростер 12 + matchup dummies + отряд L→R **тыл · центр · танк** (танк справа); empty slots = stitch tips |
| `practice_fight` | `practice_fight.html` | Stitch dojo battle HUD v2 + dummy art | Бой в додзё · dummy cards 2∶3 + VS + 6-card hand · без меню · только Выход (`#pfBack`) |
| `guild_hub` | `guild_hub.html` | 18c7 interior + battle-front map | Хаб ордена · 6 пинов (зал / участники / тех / казна / чат / война) |
| `guild` | `guild.html` | 18c7 + batch3 hall | Зал гильдии (главная) · орден / осада / рейд / очаг |
| `guild_members` | `guild_members.html` | 18c7 `guild_members` | Участники и состав · реестр + досье |
| `guild_tech` | `guild_tech.html` | 18c7 `guild_tech` | Развитие и технологии · алтарь + древо |
| `guild_treasury` | `guild_treasury.html` | 18c7 `guild_treasury` | Казна и задания · подношения + поручения |
| `pass` | `pass.html` | pass-hearth (Downloads боевой пропуск) | Боевой пасс · сезон / dual-track / claim |
| `chat_global` | `chat_global.html` | ba17 chat + guild-shell | Друзья › Чаты · каналы / лента / инспектор |
| `chat_guild` | `chat_guild.html` | ba17 root | Чаты гильдии · wireframe (под Гильдии) |
| `chat_friends` | `chat_friends.html` | guild_members pattern | Друзья › Список друзей · ростер + досье |
| `tavern` | `tavern.html` | 17eb `pve` | Таверна · молоко со льдом + PvE бафф-напитки |
| `shop` | `shop.html` | 17eb `_2` | Магазин · донат / пасс / ингредиенты / 12 котов / серая броня |
| `market` | `market.html` | 17eb `_3` | Рынок · инструменты / семена / скупка |
| `auction` | `auction.html` | 17eb `_4` | Аукцион · лоты игроков |
| `rating_players` | `rating_players.html` | 17eb `_5` + dense hall | Рейтинг · игроки (Колизей / MMR) |
| `rating_dungeon` | `rating_dungeon.html` | 17eb layout × dungeon | Рейтинг · данжи (скорость / ★) |
| `rating_raid` | `rating_raid.html` | 17eb layout × raid | Рейтинг · рейд (урон / вклад) |
| `rating_guilds` | `rating_guilds.html` | 17eb `_5` + dense hall | Рейтинг · гильдии (слава / осады) |

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
| PvP load/fight/victory etalons | `stitch-ref/pvp-battles/{pvp-load,pvp-fight,pvp-victory,arena-*}.png` |
| Guild members / tech / treasury etalon plates | `stitch-ref/18c7/guild_{members,tech,treasury}.{html,png}` (+ art PNGs) — live routes wired 2026-11-22 |
| Practice fight screenshot | `stitch-ref/18c7/practice.png` |
| Practice lobby gold + dummy masters | `stitch-ref/practice-dojo-gold/` (lobby PNG + oak/berserk/totem) |
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

§7 soft gaps: practice **start** art (win hall wired via victory-practice); per-mode fight/win skins for Mythmir / PvP / dungeon / raid / GvG (shared fight + win/lose work).

## Nav prefs (2026-11-05)

- Primary **Дом Хранителя**; sub `home` = **Персонаж** (cat + equip + inventory).
- `formation` inline before fights — **not** a Бои subtab.
- Home: no on-screen portals (chrome `#appNav` only).
- Friends: `chat_friends` = Список друзей; `chat_global` = Чаты (dense tavern layout). `chat_guild` stays under Гильдии.
- Ratings: dense 16:9 hall ×4 — players / dungeon / raid / guilds (shared chrome + mode chips).
- Trade hub mock is art-only; primary Торговля opens first subtab (`tavern`).

## Layout rule (all forms)

Andrew / preferences: **landscape**; **same form size** (`#app` 16:9 stage); **blocks filled** (no empty holes); **single flush level**.  
Shell: `data-layout="landscape"` + `.mythfel-form` on every view; CSS `--mythfel-form-ratio`.

## Battles/trade/guild etalons (2026-11-06)

Imported PNGs → `design/stitch-ref/battles-trade-guild-etalons/` + overwrite e608/4da7/17eb/18c7 plate refs. Live BGs: battle/result_win/practice/yard/guild_battle/boss_dungeon + ambient shop/market/auction/pvp/boss_raid/gear. Nav IA + Двор unchanged. Inventory etalon 17 → gear ambient (no new route).

## Batch3 trade/pass/guild etalons (2026-11-06)

`batch3-etalons/` 01–19 → 17eb/ba17/18c7 plates + ambient on tavern/pass/chats/ratings; shop/market/auction ambient refreshed. Market «Семена для Двора»; chat/pass farm copy → Двор. Design-system 01 inventory-only.
