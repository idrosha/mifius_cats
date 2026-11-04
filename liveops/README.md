# mythfel-liveops

Versioned remote config + JSON Schema. SSOT: `docs/FULL-SPEC.md` §7.4, §8.4; skill `docs/skills/liveops.md`.

Меняет limits/balance **без** релиза клиента в сторе. Сервер авторитетен для боевых чисел.

| Ключ §7.4 | Источник чисел |
|---|---|
| `class_mods` | §2.2 (+15/−15/kinship +10) + роли/стихии |
| `energy_table` | §3.3 |
| `milk_thresholds` | §3.4; drops=3 — Phase1 §16 default (как в `battle/`) |
| `mouse_hour` | §3.4 turn 10; decay=1 — Phase1 §16 default |
| `limits` | §5 Free 3/5, Pass ×2 |
| `pity` | §5 soft50 / hard80 |
| `shop` | kinds из §5/§2.5; `offers` пусто (без выдуманных цен) |
| `season` | §4.3 28 days; soft-cap off (§16) |
| `feature_flags` | SL: clan/farm/nursery off (§1 MUST NOT) |

```bash
cd liveops
go test ./...
go run ./cmd/validate
go run ./cmd/cdn-stub -geo soft-launch/geo_allowlist.example.json
# → http://localhost:8090/v1/liveops.json  (X-LiveOps-Signature: stub)
```

Soft launch ops: `soft-launch/README.md`. Changelog: одна строка на изменение — `CHANGELOG.md`.

## DoD slice

- JSON Schema на все ключи §7.4
- `config/v1/liveops.json` валиден
- CI/`go test` падает на unknown `card_id` / неполную схему
- Без выдуманных shop SKU/цен
- CDN stub + example geo allowlist (Phase 4); без production signing keys

## Не в дереве liveops

Production CDN keys, store credentials, priced shop catalog, Unity Addressables.
