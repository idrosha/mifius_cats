# Mythfel Web HUD (ручной smoke без Unity)

Тонкий HTML/JS клиент: Hub + Battle HUD поверх существующих stubs.

- LiveOps CDN stub → `:8090`
- `battle/cmd/devapi` → `:8081`
- этот HUD → `:8088` (проксирует оба API, без CORS)

Боевые числа и результат — только из `stateDiff` сервера (§3.6 / §8.2). Клиент не считает урон/награды.

## Запуск

Из корня репо (нужны Go + Node 20+):

```bash
./qa/run-web-hud.sh
```

Или вручную в трёх терминалах:

```bash
# 1) LiveOps
cd liveops && go run ./cmd/cdn-stub -addr 127.0.0.1:8090 -geo soft-launch/geo_allowlist.example.json

# 2) Battle
cd battle && go run ./cmd/devapi -addr 127.0.0.1:8081 -content ../content

# 3) HUD
cd client/web-hud && node server.mjs
# → http://127.0.0.1:8088/
```

Переменные HUD-сервера: `HUD_ADDR` (default `0.0.0.0`), `HUD_PORT` (8088), `BATTLE_URL`, `LIVEOPS_URL`.

Регион soft-launch: `?region=RU` (header `X-Client-Region`).

## Что играбельно

| Экран | Поведение |
|---|---|
| Boot | fetch LiveOps + healthz battle |
| Hub | вкладки §6; Кланы/Ферма/Питомник → «Скоро» по `feature_flags` |
| Двор / Туториал | CreatePvE `test_yard_1` + стартеры; ручной ход → сервер крутит бота P2 |
| Battle HUD | board 3+3, hand, energy, milk, keep, end turn, surrender |
| Автопобеда | CreatePvE `autoPlay` (smoke §13.1) |
| PvP smoke | CreatePvP autoPlay + List/GetReplay |
| Магазин | офферы из LiveOps (сейчас пусто — пустой UI) |
| RU/EN | keys из `content/i18n/ru_en.json` |

## Stub / вне скоупа

- Nakama auth, инвентарь, лимиты bowls/tickets, IAP, гача
- Unity / WebGL, арт Addressables
- Реальный матчмейкинг PvP (только local autoPlay)
- Ферма / питомник / клан-босс геймплей (только «Скоро»)
- Production CDN signature

См. также: `qa/DEVICE_SMOKE.md`, корневой `ЗАПУСК.md` §3.
