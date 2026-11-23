# PvP team matrix — tank · DPS · support

Статический `team_power` по 108 комбинациям (3 танка × 12 DPS × 3 саппорта).

Источник: `balance-report.json` после `scripts/gen-elven-attack-kits.ps1`.

## Gate

| Метрика | Результат |
|---------|-----------|
| Kit `card_power` ±5% | **PASS** (avg ≈40.8, min≈39.4, max≈42.5) |
| Team power ±5% | **PASS** (avg ≈122.9, min≈120.9, max≈125.8) |
| Mirror winrate ±2% | **PENDING** (нужен Go `CreatePvP` AutoPlay) |

## Правильный строй

`lane0 tank` · `lane1 любой DPS (fighter/assassin/ranger/mage)` · `lane2 support`

Примеры равных триад (разница team_power ≪ 5%):

| Team A | Team B | Заметка |
|--------|--------|---------|
| tank_fire · fighter_water · support_water | tank_wind · mage_fire · support_wind | mirror-fair по power |
| tank_water · assassin_wind · support_fire | tank_fire · ranger_wind · support_water | pierce tank vs hunter |
| tank_wind · fighter_fire · support_wind | tank_water · mage_water · support_fire | reflect vs control |

## Архетипы (PvE identity, PvP equal)

| Герой | PvE-задача |
|-------|------------|
| tank_fire | taunt + poke |
| tank_water | pierce / fragile bosses |
| tank_wind | reflect on mass hits |
| fighter_fire | burst crit |
| fighter_water | heavy smash |
| fighter_wind | hybrid cleave |
| assassin_fire | stealth crit |
| assassin_water | backline execute |
| assassin_wind | poison spread |
| ranger_fire | hunter lowest_hp |
| ranger_water | mass volley |
| ranger_wind | mark (vuln) + pierce |
| mage_fire | AoE + vuln |
| mage_water | freeze control |
| mage_wind | hybrid bolt |
| support_fire | heal + smite |
| support_water | heal + cleanse |
| support_wind | heal + ATK buff |
