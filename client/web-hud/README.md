# Mythfel Web HUD (ручной smoke без Unity)

Тонкий браузерный клиент против `battle/cmd/devapi` + LiveOps CDN stub.

**UI:** Stitch packs **0268 + 64d5 + e608 + 4da7 + 18c7 + ba17 + 17eb** (Дом Хранителя / персонаж / коллекции / сеты / крафт / питомник / кодекс / ферма + login/hub + **бои** + **pass/chats** + **таверна/магазин/рынок/аукцион/рейтинги**). Остальные IA-маршруты — placeholder hosts. Formation — **inline** (не вкладка Бои). Home без порталов (chrome `#appNav`).

**Layout:** landscape; same form size (16:9 `#app` stage); blocks filled; single flush level (`.mythfel-form`).

Боевые числа и результат — только из `stateDiff` сервера (§3.6 / §8.2).

## Запуск

Из корня репо (нужны Go + Node 20+) — **только по явной команде Andrew**:

```bash
./qa/run-web-hud.sh
# → http://127.0.0.1:8088/?region=RU
```

## Rebuild Stitch

```bash
cd client/web-hud
npm run vendor-stitch   # download aida-public + rewrite → local
npm run build-stitch    # design/stitch-src → public/index.html + public/stitch/
npm run verify-nav      # static graph; HTTP optional if HUD up
```

Карта экранов: `design/SCREEN-MAP.md`.

## Stub / вне скоупа

- Nakama auth, IAP, гача RNG, real PvP MM
- Farm / nursery / clan-boss gameplay (Soon)
- Painted mocks ещё не в паках: practice start/win/lose, result_lose, equip_cards, soon_clan; per-mode fight/win beyond shared + practice fight (trade + ratings wired in 17eb)
