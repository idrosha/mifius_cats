# Mythfel Web HUD (ручной smoke без Unity)

Тонкий браузерный клиент против `battle/cmd/devapi` + LiveOps CDN stub.

**UI status:** old Stitch design pack removed from `main`. Visual screens await a clean new Stitch import. Kept: `server.mjs` proxy, `public/app.js` battle/nav wire logic, minimal chrome + `#wireDock` shell, `public/content/` JSON.

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

## Stub / вне скоупа

- Nakama auth, инвентарь, лимиты bowls/tickets, IAP, гача RNG
- Unity / WebGL, арт Addressables
- Реальный матчмейкинг PvP (только local autoPlay)
- Ферма / питомник / клан-босс геймплей (только «Скоро»)
- Production CDN signature
- Маркетплейс за деньги / крипта (запрещено §1)
- Painted Stitch screens (awaiting re-import)

См. также: `qa/DEVICE_SMOKE.md`, корневой `ЗАПУСК.md` §3.
