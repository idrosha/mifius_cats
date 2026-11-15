# Nav IA (Web HUD)

Канон кнопок: `NAV` + `fillNav` в `client/web-hud/public/app.js`.  
Chrome: только `#appNav` / `#appSubTabs` (не Stitch-headers экранов).

Синонимы URL → route: alias-map в том же `app.js`.

## Primary → subtabs

| Primary | Label | Default route | Subtabs |
|---|---|---|---|
| `pass` | СЕЗОН | `pass` | _(нет — один экран)_ |
| `mythmir` | МИФМИР | `yard` | `battle_hub`, `practice`, `pve` (= yard), `boss_dungeon` |
| `character` | ДОМ ХРАНИТЕЛЯ | `home` | `farm` (Soon), `craft` (gated), `home` (персонаж), **`gear` (Склад)**, `collection`, `breeding` (gated) |
| `combat` | БОИ | `pvp` | `pvp`, `boss_raid`, `guild_battle` |
| `trade` | ТОРГОВЛЯ | first tab | `trade_hub`, `tavern`, `shop`, `market`, `auction` |
| `guilds` | ГИЛЬДИЯ | first tab | `guild_hub`, `guild`, `chat_guild`, `rating_players`, `rating_guilds`, `chat_friends`, `chat_global`, `codex` |

`formation` — inline перед боем, **не** вкладка Бои.

## Склад

- Route: `gear` · UI: **Склад** (канон) = амбар игрока
- Parent: `character` (ДОМ ХРАНИТЕЛЯ)
- Не путать: «склад алхимика» / craft «Склад Сырья» — ферма Phase 6, **не** этот route
- `armor_sets` / `class_sets` / `equip_cards` — справочник/gated, не второй склад
- Alias: `sklad` → `gear` (legacy stitch paths)
- SL: HUD stub (`D-028` Accepted); бой не считает статы экипа с клиента как SoT

## Правила правок IA

1. Менять структуру только в `NAV` (+ этот файл + SCREEN-MAP при новых routes).
2. `tabs: []` только у single-route primary (сейчас `pass`).
3. Не возвращать второе меню из вёрстки экрана.
4. Hub: только shared `#appNav` / `#appSubTabs` (`D-029`); Stitch hub-bar / dock не навигируют.
