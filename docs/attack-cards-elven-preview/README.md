# Attack cards elven preview (18×6)

Playable kits + art staging for `docs/stitch-prompts-attack-cards-elven-18x6.md`.

## Chrome (готово)

| Element | Asset |
|---------|-------|
| fire | `client/web-hud/public/stitch-assets/attack-cards/chrome/elven/card_frame_fire.jpg` |
| water | `…/card_frame_water.jpg` |
| wind | `…/card_frame_wind.jpg` |

## Content (сгенерировано)

| Артефакт | Путь |
|----------|------|
| 108 card JSON | `content/cards/shop_{role}_{element}_{part}.json` |
| 18 cat templates | `content/cats/elven_18.json` |
| 108 parts | `content/parts/elven_18.json` |
| Manifest | `manifest.json` |
| Balance | `balance-report.json` |
| Regen | `scripts/gen-elven-attack-kits.ps1` |

Template ids: `shop_tank_fire` … `shop_support_wind` (без A/B).

## Balance gate (статический card_power)

Формула: `atk×hits (+AoE×2) + shield + heal×0.9 (+ally_all×3) + control-weight`.

Последний прогон:

- **kit band ±5%:** PASS  
- **team tank×DPS×support (108 комбинаций) ±5%:** PASS  

См. `balance-report.json`. Mirror winrate ±2% — после `go test` / `CreatePvP` AutoPlay (нужен Go в PATH).

## Art progress

**108/108 COMPLETE** — папки `{heroId}/` → `attack_{role}_{element}_{part}.jpg`.  
Chrome refs: `card_frame_{fire|water|wind}.jpg`. Копирование: `scripts/copy-elven-card-art.ps1`.

Все 18 героев × 6 parts готовы в preview.  
После approve — перенос в `client/web-hud/public/stitch-assets/attack-cards/` + compose switch с D-045.

## Engine hooks

- `wind` element triangle в `battle/internal/sim/elements.go`
- `reflect` status (30–40% return while taunted) в `battle/internal/sim/effects.go`
