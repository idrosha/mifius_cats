# Кооп-данжи ×3 — канон (PvE, не рейд, не соло-Мифмир)

**Статус:** content+HUD **v3** · бой 3v3 · пати 4×3  
**Время:** короткий **≤10 мин** · длинный **≤15 мин**  
**SSOT:** `content/campaign/dungeons_coop_v1.json` (v3)  
**Лут:** `content/campaign/dungeon_rewards_v1.json`  
**Редметы:** `content/items/dungeon_rares.json`  
**Stages:** `content/stages/dungeon_*.json` (+ `*_boss_long` HP×1.2)

## Модель

- Лобби: 4 игрока × 3 котика — **создать / войти по коду / ready / боты** (`/api/dev/dungeon/party/*`).
- Боевой узел: ядро **3v3** (`CreatePvE`) — у каждого свой бой; пати = лобби+лут-контракт.
- Развилка: короткий / длинный; на длинном **F2 налево/направо**.
- Длинный босс: отдельный stage `*_boss_long` (HP выше).
- Вход: **ключ** (starter / buy fish / spend API).
- Редметы: только с босса → склад + `/api/dev/dungeon/clear`.

## Пробелы

| # | Тема | Статус |
|---|---|---|
| 1–6 | Канон / stages / ключи / F2 / лут | ✅ |
| 7 | Live 4-player MM | ⚠️ lobby+join+ready+poll; бой всё ещё личный 3v3 |
| 8 | Economy SoT | ✅ Go `economy/dungeon.go` + HUD API |
| 9 | Уникальный stitch-арт | ⚠️ named aliases (не новый pixel) |
| 10 | Smoke | ✅ catalog + api + boss HP |
| 11 | AutoPlay Go | ⏳ vet/compile Access Denied (economy package tests зелёные до vet) |

## Тест

```bash
node qa/gate/dungeon_coop_smoke.mjs
node qa/gate/dungeon_api_smoke.mjs
node qa/gate/dungeon_boss_hp_smoke.mjs
```

Ручной: `qa/DUNGEON_COOP.md` — Создать → код → второй клиент Войти → Ready → Боты → В путь.
