# Device smoke — Phase 4 soft launch

SSOT: `docs/FULL-SPEC.md` §13 (на устройстве), §12 mobile-first, §14 limited geo.  
Роль: `qa`. **Не** требует store credentials в репо.

Автогейт §13 закрыт (`./qa/run-acceptance.sh`). Phase 4 in-repo: `./qa/run-soft-launch.sh`.  
Этот файл — **как дойти до ручного smoke** и что отметить на живой сессии.

## 0. Runnable path без Unity Editor (обязательный шаг перед телефоном)

В репо нет Unity-проекта / Play Mode сцены — только presenter classlib.  
До mobile-билда человек гоняет **LocalSmoke**: Hub + Shop + Tutorial + BattlePresenter + Replay против локальных stubs (без prod secrets).

```bash
# из корня репо; нужны Go + .NET 8 SDK
./qa/run-local-smoke.sh
```

Что поднимает скрипт:

| Сервис | Адрес | Секреты |
|---|---|---|
| LiveOps CDN stub | `http://127.0.0.1:8090/v1/liveops.json` | только `X-LiveOps-Signature: stub` |
| battle/devapi | `http://127.0.0.1:8081` | нет (localhost CreatePvE / SubmitAction / replay) |
| Mythfel.LocalSmoke | console | нет |

Ручной запуск по частям (если отладка):

```bash
# терминал 1
cd liveops && go run ./cmd/cdn-stub -geo soft-launch/geo_allowlist.example.json

# терминал 2
cd battle && go run ./cmd/devapi -content ../content

# терминал 3
export LIVEOPS_URL=http://127.0.0.1:8090/v1/liveops.json
export BATTLE_URL=http://127.0.0.1:8081/
export CLIENT_REGION=RU
cd client && dotnet run --project tools/Mythfel.LocalSmoke
```

Офлайн без HTTP (только stub payloads):

```bash
cd client && dotnet run --project tools/Mythfel.LocalSmoke -- --stub-only
```

Ожидание: exit `0`, строки `PASS …`, итог `LocalSmoke: READY`.

## 1. Предусловия soft-launch gate

```bash
./qa/run-soft-launch.sh          # §13 + geo example + CDN ephemeral smoke
```

Клиент Boot (когда появится Unity) должен ходить на `http://<host>:8090/v1/liveops.json` с `X-Client-Region` из ops allowlist.  
До этого — LocalSmoke делает тот же fetch через `HttpLiveOpsSource`.

## 2. §13 на устройстве (отметить вручную)

Пока нет Unity/mobile APK в репо — строки ниже остаются **MANUAL / BLOCKED билд**.  
LocalSmoke закрывает логику presenter-слоя для пунктов 1, 5–8, 10 (частично) на десктопе.

| # | Проверка | Desktop LocalSmoke | Device OK? | Заметки (seed/replay/battleId) |
|---|---|---|---|---|
| 1 | Туториал → победа Двора &lt;10 мин | PASS* (autoPlay `test_yard_1`) | ☐ | |
| 2 | Лимиты 3 PvE / 5 PvP server-side | backend `go test` / `cmd/check` | ☐ | |
| 3 | Пасс ×2 + no-ads | backend auto | ☐ | |
| 4 | Pity hard 80 | backend auto | ☐ | |
| 5 | Нелегальный card play → reject | PASS* (devapi 400) | ☐ | |
| 6 | PvP replay открывается | PASS* (CreatePvP autoPlay → GetReplay) | ☐ | |
| 7 | «Скоро» вкладки видны, не крашат | PASS* (Hub Soon) | ☐ | |
| 8 | RU/EN переключение | PASS* (SetLocale) | ☐ | |
| 9 | IAP **sandbox** yarn → jar (не prod verify) | backend auto; UI IAP нет | ☐ | |
| 10 | Смена LiveOps `limits` без ребилда (CDN stub) | PASS* fetch stub | ☐ | |

\* = подтверждается `./qa/run-local-smoke.sh`, не заменяет визуальный Unity Play.

## 3. Geo / analytics

| Проверка | Desktop | Device OK? |
|---|---|---|
| Регион из allowlist → Boot LiveOps 200 + `soft_launch_flag` allowed=1 | LocalSmoke `CLIENT_REGION=RU` | ☐ |
| Регион вне allowlist → 403 / allowed=0 | LocalSmoke geo deny US + CDN 403 | ☐ |
| Crash-free целевой ориентир §12 | — | ☐ наблюдать сессии |

## 4. Unity (когда появится проект)

Целевой путь (ещё **не** в репо):

1. Открыть будущий `client/` Unity project в Hub (URP 2D) → Play.
2. Указать LiveOps URL `http://<lan-ip>:8090/v1/liveops.json` и battle `http://<lan-ip>:8081`.
3. На эмуляторе Android: host loopback = `10.0.2.2` вместо `127.0.0.1`.
4. Пройти таблицу §13 выше на устройстве; баги → `BUG_TEMPLATE.md` с seed/replay.

До появления Unity-проекта **не** считать Phase 4 §14 закрытым на реальном гео — только in-repo + LocalSmoke.

## 5. Блокеры реального device/geo launch (честно)

- Нет подписанного Unity/mobile билда в CI этого репо (presenter + LocalSmoke console).
- Нет production LiveOps CDN + реальной подписи JSON (только `X-LiveOps-Signature: stub`).
- Нет store IAP verify / priced SKU (sandbox only в `backend/`).
- Нет Nakama/prod battle endpoint (есть только `battle/cmd/devapi` localhost).
- Реальный geo allowlist и ключи — **вне** git (ops), пример в `liveops/soft-launch/`.

Баги → `BUG_TEMPLATE.md`.
