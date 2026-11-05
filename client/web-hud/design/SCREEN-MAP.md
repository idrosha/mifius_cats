# Stitch screen map — packs 0268 + 64d5

Sources:
- `media/stitch-new-0268/stitch_mythfel_mobile_game_ui_0268.zip`
- `media/stitch-new-0268/stitch_mythfel_mobile_game_ui__1__64d5.zip`

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

## Placeholders (IA route, no painted mock in these packs)

`practice`, `yard`, `formation` (inline only — no combat subtab), `battle`, `result_*`, `shop`, `market`, `tavern` (milk bar ≠ login), `pass`, `pvp`, `soon_clan`, `equip_cards`, `auction`, `guild`, `chat_*`, `rating_*`, `boss_dungeon`, `boss_raid`.

## Nav prefs (2026-11-05)

- Primary **Дом Хранителя**; sub `home` = **Персонаж** (cat + equip + inventory).
- `formation` inline before fights — **not** a Бои subtab.
- Home: no on-screen portals (chrome `#appNav` only).

## Layout rule (all forms)

Andrew / preferences: **landscape**; **same form size** (`#app` 16:9 stage); **blocks filled** (no empty holes); **single flush level**.  
Shell: `data-layout="landscape"` + `.mythfel-form` on every view; CSS `--mythfel-form-ratio`.
