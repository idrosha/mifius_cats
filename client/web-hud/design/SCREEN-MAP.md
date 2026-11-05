# Stitch screen map — packs 0268 + 64d5 + e608 + 4da7 + 18c7

Sources:
- `media/stitch-new-0268/stitch_mythfel_mobile_game_ui_0268.zip`
- `media/stitch-new-0268/stitch_mythfel_mobile_game_ui__1__64d5.zip`
- `media/stitch-battles-2/stitch_mythfel_mobile_game_ui__2__e608.zip`
- `media/stitch-battles-2/stitch_mythfel_mobile_game_ui__3__4da7.zip`
- `media/stitch-battles-3/stitch_mythfel_mobile_game_ui__5__18c7.zip`

DESIGN.md = theme **Tavern Hearth Battler** (shared tokens).

## Wired (painted → `design/stitch-src`)

| Route | File | Pack folder | Notes |
|---|---|---|---|
| `hub` | `hub.html` | 0268 `_1` | Главный Хаб |
| `login` | `login.html` | 0268 `_2` | Вход / Регистрация / Войти в Таверну |
| `collection` | `collection.html` | 0268 `_3` | Коллекция котиков |
| `armor_sets` | `armor_sets.html` | 0268 `_4` | Атлас сетов брони |
| `gear` | `gear.html` | 0268 `_5` | Кузница / Оружейная |
| `class_sets` | `class_sets.html` | 0268 `_6` | Классовые сеты |
| `home` | `home.html` | 0268 `_7` | Дом Хранителя: кот + экип + инвентарь (no portals — Stitch header nav killed) |
| `breeding` | `breeding.html` | 64d5 `_1` | Питомник / скрещивание |
| `craft` | `craft.html` | 64d5 `_2` | Крафт & алхимия |
| `codex` | `codex.html` | 64d5 `_3` | Кодекс Мифмира |
| `heroes` | `heroes.html` | 64d5 `_4` | Кодекс боевых архетипов |
| `soon_farm` / `farm` | `soon_farm.html` | 64d5 `_5` | Ферма / угодья (Soon gameplay) |
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

## Placeholders (IA route, no painted mock yet)

`result_lose`, `shop`, `market`, `tavern` (milk bar ≠ login), `pass`, `soon_clan`, `equip_cards`, `auction`, `chat_*`, `rating_*`.

§7 gaps still open: practice **start / win / lose**; shared `result_lose`; per-mode fight/win for Mythmir / PvP / dungeon / raid / GvG (only practice fight painted in 18c7).

## Nav prefs (2026-11-05)

- Primary **Дом Хранителя**; sub `home` = **Персонаж** (cat + equip + inventory).
- `formation` inline before fights — **not** a Бои subtab.
- Home: no on-screen portals (chrome `#appNav` only).

## Layout rule (all forms)

Andrew / preferences: **landscape**; **same form size** (`#app` 16:9 stage); **blocks filled** (no empty holes); **single flush level**.  
Shell: `data-layout="landscape"` + `.mythfel-form` on every view; CSS `--mythfel-form-ratio`.
