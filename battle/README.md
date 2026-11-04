# mythfel-battle (Phase 1)

Go-пакет симулятора 3v3. **Одно ядро** для PvE и PvP (`internal/sim`); различия mode-layer:

| API (§8.2) | Отличие |
|---|---|
| `mode.CreatePvE` | `stageId`, враги из stage, AI на стороне P2 |
| `mode.CreatePvP` | `matchId`, две человеческие команды |

Боевые правила — только `docs/FULL-SPEC.md` §3 (+ роли/стихии §2.1–2.2).

```bash
cd battle
go test ./...
UPDATE_GOLDEN=1 go test -run Golden ./...   # перезаписать golden
go run ./cmd/sim -content ../content
```
