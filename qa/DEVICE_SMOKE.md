# Device smoke — Phase 4 soft launch

SSOT: `docs/FULL-SPEC.md` §13 (на устройстве), §12 mobile-first, §14 limited geo.  
Роль: `qa`. **Не** требует store credentials в репо.

Автогейт §13 закрыт (`./qa/run-acceptance.sh`). Этот чеклист — живой smoke на телефоне/эмуляторе после CDN stub + geo.

## Предусловия (локально, без секретов)

```bash
# LiveOps CDN stub (ЗАПУСК :8090) + пример geo
cd liveops && go run ./cmd/cdn-stub -geo soft-launch/geo_allowlist.example.json

# автогейт + CDN/geo smoke
./qa/run-soft-launch.sh
```

Клиент Boot должен ходить на `http://<host>:8090/v1/liveops.json` с `X-Client-Region` из ops allowlist.

## §13 на устройстве (отметить вручную)

| # | Проверка | OK? | Заметки (seed/replay/battleId) |
|---|---|---|---|
| 1 | Туториал → победа Двора &lt;10 мин | ☐ | |
| 2 | Лимиты 3 PvE / 5 PvP server-side | ☐ | |
| 3 | Пасс ×2 + no-ads | ☐ | |
| 4 | Pity hard 80 | ☐ | |
| 5 | Нелегальный card play → reject | ☐ | |
| 6 | PvP replay открывается | ☐ | |
| 7 | «Скоро» вкладки видны, не крашат | ☐ | |
| 8 | RU/EN переключение | ☐ | |
| 9 | IAP **sandbox** yarn → jar (не prod verify) | ☐ | |
| 10 | Смена LiveOps `limits` без ребилда (CDN stub) | ☐ | |

## Geo / analytics

| Проверка | OK? |
|---|---|
| Регион из allowlist → Boot получает LiveOps 200 + событие `soft_launch_flag` allowed=1 | ☐ |
| Регион вне allowlist → 403 / нет прогресса SL + `soft_launch_flag` allowed=0 | ☐ |
| Crash-free целевой ориентир §12 — наблюдать сессии (не автогейт) | ☐ |

## Блокеры реального device/geo launch (честно)

- Нет подписанного Unity/mobile билда в CI этого репо (presenter-only .NET classlib).
- Нет production LiveOps CDN + реальной подписи JSON (только `X-LiveOps-Signature: stub`).
- Нет store IAP verify / priced SKU (sandbox only).
- Нет Nakama/prod battle endpoint для полевого PvP.
- Реальный geo allowlist и ключи — **вне** git (ops), пример в `liveops/soft-launch/`.

Баги → `BUG_TEMPLATE.md`.
