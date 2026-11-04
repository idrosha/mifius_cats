# Acceptance soft launch — FULL-SPEC §13

Источник: `docs/FULL-SPEC.md` §13. Статусы по состоянию кода на ветке с этим харнессом.

Легенда: **PASS** автозелёный · **PARTIAL** кусок есть, SL не закрыт · **BLOCKED** нет реализации MUST · **MANUAL** нужна живая сессия · **SKIP** тулчейн недоступен в CI/среде.

| # | Критерий §13 | Статус | Автогейт / доказательство | Блокер soft launch |
|---|---|---|---|---|
| 1 | Туториал → победа Двора &lt;10 мин на стартерах | PARTIAL | `battle` golden `starters_vs_test_yard_1` (seed `20261104`) — победа Двора есть; **туториала нет** | Туториал + замер &lt;10 мин на клиенте |
| 2 | 3 PvE + 5 PvP лимиты server-side | PASS | `backend` `TestRefillAndSpend_FreeDailyLimits` + `go run ./cmd/check` | — |
| 3 | Пасс ×2 и no-ads | PASS | `backend` `TestPassDoublesLimits_AndNoAds` | — |
| 4 | Гача pity срабатывает на hard 80 | BLOCKED | `liveops` конфиг `pity.hard=80` + `qa/gate` SSOT-числа; **нет** jar RNG / pity state (§8.3) | Backend jars + pity (§5 / skill backend) |
| 5 | Нелегальный card play отвергается | PASS | `battle` `TestCreatePvP_SharesCore` (illegal unit → error) | — |
| 6 | Реплей PvP открывается | BLOCKED | Нет хранилища последних 10 PvP / UI открытия (§3 replay, §1 MUST) | Replay store + client open |
| 7 | «Скоро» вкладки видны, не крашат | PASS* | `client` `HubPresenterTests` (Clans/Farm/Nursery Soon); `*` нужен `dotnet test` | — (если SKIP SDK — прогнать локально) |
| 8 | RU/EN переключение | PARTIAL | `content/i18n/ru_en.json` + `qa/gate` все ключи имеют `ru` и `en`; `DictionaryLocCatalog.Resolve(locale)`; **нет** UI switch / presenter SetLocale | Клиентский переключатель локали |
| 9 | IAP sandbox yarn → jar | BLOCKED | IAP validate / grant yarn / open jar — не в коде (backend README «Не в этом PR») | IAP sandbox + jar open |
| 10 | LiveOps смена `limits` без ребилда клиента | PASS | `liveops` schema+validate; `qa/gate` мутация `limits` остаётся валидной; клиент читает `ILiveOpsSource` | Wiring remote fetch в проде — отдельно |

## Итог soft-launch gate

**Не готов.** Закрыты автоматом: §13.2, §13.3, §13.5, §13.10 (+ §13.7 при наличии .NET).  
Блокеры MUST: **§13.4**, **§13.6**, **§13.9**; частично **§13.1**, **§13.8**.

Out-of-scope SL (§1 MUST NOT — клан-босс / ферма / питомник геймплей) → не баги; «Скоро» (§13.7) ожидаемо.

## Ручной прогон (когда появится клиент Play)

См. `ЗАПУСК.md` §3. Для каждого PASS выше — smoke на устройстве; для BLOCKED — не отмечать PASS до реализации. Баги → `BUG_TEMPLATE.md` с seed/replay.
