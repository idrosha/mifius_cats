# mythfel-backend (economy)

Economy-модуль (§8.3): лимиты, инвентарь, jars + pity, IAP sandbox. Вызывается из Nakama hooks / RPC; **не** резолвит бой (это `battle/`).

SSOT: `docs/FULL-SPEC.md` §5, §7.5, §8.1/§8.3, §4.1–4.2, §10 (2 jar tables), §13.2–4 / §13.9, §16 (TZ=UTC).

| Правило | Free | Pass (§5 ×2) |
|---|---|---|
| PvE/day (bowl) | 3 | 6 |
| PvP/day (ticket) | 5 | 10 |
| Gacha pity | soft50 / hard80 | same |

```bash
cd backend
go test ./...
go run ./cmd/check
```

## DoD slice

- `Player` поля §7.5
- `RefillDaily` UTC+0 → bowls/tickets = дневной кап
- `SpendBowl` / `SpendPvPTicket` server-side
- PassActive → ×2; AdsHidden (no-ads §13.3)
- Grant валют только через economy API
- `OpenJar` + `PityState` — hard pity на 80 (§13.4); таблицы `cats` / `gear` (§10)
- `ValidateAndGrantIAP` sandbox + `SandboxYarnThenJar` (§13.9) — **без** выдуманных store-цен (`shop.offers` пуст)
- `go test` зелёный

## Не в этом PR

Nakama runtime wiring, production store receipt verify, priced yarn/jar SKU catalog, weighted drop % (StaticJarPool = common / forced rare), battle CreatePvE/PvP, PvP replay (§13.6).
