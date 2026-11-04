# Soft launch ops (Phase 4)

SSOT: `docs/FULL-SPEC.md` §14 (ограниченное гео), §8.4 LiveOps CDN, §11 `soft_launch_flag`.

| Файл | Назначение |
|---|---|
| `geo_allowlist.example.json` | Пример ISO alpha-2 allowlist. Копировать → локальный/CI секрет-стор ops, **не** коммитить прод-список с ключами |
| `../cmd/cdn-stub` | Локальный CDN `:8090` (ЗАПУСК) |

```bash
# CDN без geo-гейта
cd liveops && go run ./cmd/cdn-stub

# CDN + geo (header X-Client-Region или ?region=)
go run ./cmd/cdn-stub -geo soft-launch/geo_allowlist.example.json

curl -s http://localhost:8090/healthz
curl -s -H 'X-Client-Region: RU' http://localhost:8090/v1/liveops.json | head
curl -s -o /dev/null -w '%{http_code}\n' -H 'X-Client-Region: US' http://localhost:8090/v1/liveops.json
```

`X-LiveOps-Signature: stub` — заглушка. Боевые ключи подписи CDN / store credentials в репо **не** класть.
