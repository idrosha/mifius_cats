# Mythfel Web HUD (ручной smoke без Unity)

Тонкий HTML/JS клиент в визуале **Stitch Tavern Hearth Battler**: Hub-порталы + полный граф экранов поверх существующих stubs.

- LiveOps CDN stub → `:8090`
- `battle/cmd/devapi` → `:8081`
- этот HUD → `:8088` (проксирует оба API, без CORS)

Боевые числа и результат — только из `stateDiff` сервера (§3.6 / §8.2). Клиент не считает урон/награды.

Дизайн: `design/DESIGN.md`, карта экранов: `design/SCREEN-MAP.md`.

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

## Граф навигации (Stitch)

| Экран | Переходы |
|---|---|
| Boot | LiveOps + battle healthz → Hub |
| Hub | порталы → Yard / Formation / PvP / Collection / Shop / Market / Tavern / Pass / Soon |
| Двор | → Formation / Battle / Tutorial / AutoPlay |
| Расстановка | → Battle / Yard / Tavern |
| Battle | stateDiff; итог → Result |
| Result | Hub / Yard / Retry / Formation |
| Таверна | напитки + зелья (stub) → Formation / Hub |
| Маркет | buy/sell stub (без денег/крипты) |
| Лавка | LiveOps offers + Gacha stub → Tavern |
| Пасс | stub трек |
| PvP | autoPlay + replays; → Formation |
| Soon | Farm / Nursery / Clan boss |

Проверка навигации: `node client/web-hud/scripts/verify-nav.mjs` (при поднятом HUD).

## Stub / вне скоупа

- Nakama auth, инвентарь, лимиты bowls/tickets, IAP, гача RNG
- Unity / WebGL, арт Addressables
- Реальный матчмейкинг PvP (только local autoPlay)
- Ферма / питомник / клан-босс геймплей (только «Скоро»)
- Production CDN signature
- Маркетплейс за деньги / крипта (запрещено §1)

См. также: `qa/DEVICE_SMOKE.md`, корневой `ЗАПУСК.md` §3.
