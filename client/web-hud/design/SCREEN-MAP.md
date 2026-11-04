# Stitch → Web HUD screen map

Sources: Project store `internal/stitch-ui/*.zip` (Tavern Hearth Battler DESIGN.md).

## Coherent nav graph (merged zip1+zip2+zip3)

| Screen id | Role | Prefer source |
|---|---|---|
| hub | Главный Хаб | zip3/4b2f landscape |
| yard | Двор (PvE) | zip2 `_1`, zip1 `landscape_6` |
| formation | Расстановка pre-battle | zip2 `formation` |
| battle | Бой HUD | zip1 `landscape_1` / `3v3_landscape` (layout only; combat = battle/devapi) |
| result | Победа / Поражение | zip2 `landscape_1` / `landscape_2` |
| collection | Коллекция | zip1 `landscape_4` |
| shop | Лавка | zip1 `landscape_3` (merchant tab) |
| market | Маркетплейс buy/sell stub | zip1 `landscape_3` auction + task brief |
| tavern | Таверна milk/drinks/potions | zip1 root `code.html` |
| pvp | PvP Арена / дуэли | zip1 `pvp`, zip2 `pvp_landscape` |
| pass | Пасс | zip1 `battle_pass` |
| gacha | Призыв (shop sub) | zip1 `landscape_5` |
| soon_farm | Ферма «Скоро» | zip3/e4fa, zip2 `_3` |
| soon_clan | Кланы «Скоро» | zip2 `landscape_3` |
| soon_nursery | Питомник «Скоро» | hub portal |

## Deduped / not separate playable screens

| Source | Why |
|---|---|
| zip1 `landscape_2` | Alternate 3v3 battle → folded into `battle` |
| zip2 `pve_12` | 12-cat legion — not SL 3v3; reference only |
| zip2 `_2` | Оружейная — post-SL; collection link → soon |
| zip2 `landscape_4` | Алтарь возвышения → collection detail stub |
| zip1 `landscape_5` | Gacha altar → shop sub-tab |
| Duplicate farm (zip3 vs e4fa) | Identical; one Soon sheet |

## Soft-launch constraints (FULL-SPEC §1 / §6)

- Playable: Hub, Yard→Formation→Battle, PvP smoke, Collection, Shop, Pass, Tavern, Market stub.
- Farm / Nursery / Clan boss = Soon sheets only.
- No combat authority on client; battle/devapi remains SoT.
