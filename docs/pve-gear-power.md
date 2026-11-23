# PvE сила: единое HP врагов, сложность от брони/оружия

**SSOT игрока:** `docs/game-wiki.md` §4.3  
**Бой:** `battle/internal/sim` (`GearBonus`, `Def`, `GearAtk`)  
**HUD:** `client/web-hud/public/app.js` (`equipLane`, `teamGear`, `lane: pve|pvp`)  
**База знаний:** codex `pve_power`, `pve_pvp_gear`, обновлённые `dungeons` / `raids` / `shop`

## Канон

1. HP монстров и боссов **фиксировано** в `content/stages/*.json` — одинаково для всех.
2. Сложность данжа/рейда/Мифмира зависит от **PvE-ленты** экипа: выше DEF/HP/weapon ATK → проще.
3. Серый PvE-сет проходит данж **с трудом**; высокий ранг — комфортнее.
4. **PvP-шмотки** — магазин / battle_coin. **PvE-шмотки** — только дроп данжей и рейдов (+ стартовый PvE grey).

## Формулы

| Часть | Поведение |
|---|---|
| Enemy spawn | `MaxHP` из template stage, без gear-множителя |
| Player spawn | `+HP`, `+Def`, `+GearAtk`, `+Spd` из `CreatePvE.teamGear` |
| Hit | `card.Atk + AtkBuff + GearAtk` |
| Mitigation | `max(1, amount − Def/2)` до щита; pierce/fragile игнорируют DEF |

## Лут сетов (SL)

| Контент | PvE set |
|---|---|
| dungeon scarlet | grey |
| dungeon howl | green |
| dungeon whisper | blue |
| raid myaurra | yellow |
| raid talass | purple |
| raid vulcan | red |
| *(endgame)* | solar R7 · or R8 |

## Тесты

```bash
cd battle
go test ./internal/sim -run TestArmorDef
go test . -run TestPvE_EnemyHPUnchangedByPlayerGear
```
