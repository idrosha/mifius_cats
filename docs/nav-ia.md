# Nav IA (Web HUD)

Канон кнопок: `NAV` + `fillNav` в `client/web-hud/public/app.js`.  
Chrome: только `#appNav` / `#appSubTabs` (не Stitch-headers экранов).

Синонимы URL → route: alias-map в том же `app.js`.

## Primary → subtabs

| Primary | Label | Default route | Subtabs |
|---|---|---|---|
| `pass` | СЕЗОН | `pass` | _(нет — один экран)_ |
| `mythmir` | МИФМИР | `yard` | `battle_hub`, `practice`, `pve` (= yard), `boss_dungeon` |
| `character` | ДОМ ХРАНИТЕЛЯ | `farm` | `farm` (Soon), `craft` (gated), `home` (персонаж), **`gear` (Склад)**, `collection`, `breeding` (gated) |
| `combat` | БОИ | first tab | `pvp`, `boss_raid`, `guild_battle` |
| `trade` | ТОРГОВЛЯ | first tab | `trade_hub`, `tavern`, `shop`, `market`, `auction` |
| `guilds` | ГИЛЬДИЯ | first tab | `guild_hub`, `guild`, `chat_guild`, `rating_players`, `rating_guilds`, `chat_friends`, `chat_global`, `codex` |

`formation` — inline перед боем, **не** вкладка Бои.

## Склад

- Route: `gear` · UI: Склад / амбар игрока
- Parent: `character` (ДОМ ХРАНИТЕЛЯ)
- Не путать со «склад алхимика» (ферма Phase 6)
- `armor_sets` / `class_sets` / `equip_cards` — справочник/gated, не второй склад
- SL: HUD stub (`D-028`); бой не считает статы экипа с клиента как SoT

## Правила правок IA

1. Менять структуру только в `NAV` (+ этот файл + SCREEN-MAP при новых routes).
2. `tabs: []` только у single-route primary (сейчас `pass`).
3. Не возвращать второе меню из вёрстки экрана.
