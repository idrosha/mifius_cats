# mythfel-backend (limits / inventory)

Economy-модуль (§8.3): дневные лимиты + инвентарь игрока. Вызывается из Nakama hooks / RPC; **не** резолвит бой (это `battle/`).

SSOT: `docs/FULL-SPEC.md` §5, §7.5, §8.1/§8.3, §4.1–4.2, §13.2–3, §16 (TZ=UTC).

| Правило | Free | Pass (§5 ×2) |
|---|---|---|
| PvE/day (bowl) | 3 | 6 |
| PvP/day (ticket) | 5 | 10 |

```bash
cd backend
go test ./...
go run ./cmd/check
```

## DoD slice

- `Player` поля §7.5
- `RefillDaily` UTC+0 → bowls/tickets = дневной кап
- `SpendBowl` / `SpendPvPTicket` server-side (отказ при 0)
- PassActive → ×2 лимитов; AdsHidden для pass (no-ads §13.3)
- Grant валют только через economy API
- `go test` зелёный

## Не в этом PR

Nakama runtime wiring, IAP validate, jar/pity RNG, battle CreatePvE/PvP, LiveOps JSON schemas, hub/shop UI.
