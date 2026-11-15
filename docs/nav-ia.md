# Nav IA (Web HUD)

Канон кнопок: `NAV` + `fillNav` в `client/web-hud/public/app.js`.  
Chrome: только `#appNav` / `#appSubTabs` (не Stitch-headers экранов).

**LOCKED `D-033`:** порядок primary/subtabs ниже — не менять без Andrew + новый `D-0xx` + патч этого файла и FULL-SPEC §6.

Синонимы URL → route: alias-map в том же `app.js`.

## Primary → subtabs

| Primary | Label | Default route | Subtabs (порядок) |
|---|---|---|---|
| `pass` | Боевой пропуск | `pass` | _(нет)_ |
| `character` | Дом Хранителя | `home` | `farm` (Двор · Soon), `craft`, `home` (Персонаж), **`gear` (Склад)**, `collection`, `breeding` |
| `trade` | Торговля | `trade_hub` | `trade_hub` (Хаб торговли Площадь), `tavern`, `shop`, `market`, `auction` |
| `combat` | Бои | `battle_hub` | `battle_hub` (Хаб боев Мифмир), `practice`, `pve` (= yard), `pvp`, `boss_dungeon`, `boss_raid`, `guild_battle` |
| `guilds` | Гильдии | `guild_hub` | `guild_hub`, `guild` (Моя гильдия), `chat_guild` |
| `ratings` | Рейтинги | `rating_players` | `rating_players` (ПВП), `rating_dungeon`, `rating_raid`, `rating_guilds` |
| `friends` | Друзья | `chat_friends` | `chat_friends` (Список Друзей), `chat_global` (Чаты) |
| `knowledge` | База знаний | `codex` | _(нет)_ |

`formation` — inline перед боем, **не** вкладка Бои.  
Atlas (`armor_sets` / `class_sets` / `equip_cards` / `heroes`) — из кодекса, не primary subtabs.

## Склад

- Route: `gear` · UI: **Склад** (канон) = амбар игрока
- Parent: `character` (Дом Хранителя)
- Не путать: «склад алхимика» / craft «Склад Сырья» — ферма Phase 6, **не** этот route
- Alias: `sklad` → `gear` (legacy stitch paths)
- SL: HUD stub (`D-028` Accepted); бой не считает статы экипа с клиента как SoT

## Правила правок IA

1. Менять структуру только в `NAV` (+ этот файл + SCREEN-MAP при новых routes) **и только с новым D-0xx** (`D-033` locked).
2. `tabs: []` только у single-route primary (`pass`, `knowledge`).
3. Не возвращать второе меню из вёрстки экрана.
4. Hub: только shared `#appNav` / `#appSubTabs` (`D-029`); Stitch hub-bar / dock не навигируют.
