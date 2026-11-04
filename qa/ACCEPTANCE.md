# Acceptance soft launch — FULL-SPEC §13

Источник: `docs/FULL-SPEC.md` §13. Статусы по состоянию кода на ветке с этим харнессом.

Легенда: **PASS** автозелёный · **PARTIAL** кусок есть, SL не закрыт · **BLOCKED** нет реализации MUST · **MANUAL** нужна живая сессия · **SKIP** тулчейн недоступен в CI/среде.

| # | Критерий §13 | Статус | Автогейт / доказательство | Блокер soft launch |
|---|---|---|---|---|
| 1 | Туториал → победа Двора &lt;10 мин на стартерах | PARTIAL | `battle` golden `starters_vs_test_yard_1` (seed `20261104`) — победа Двора есть; **туториала нет** | Туториал + замер &lt;10 мин на клиенте |
| 2 | 3 PvE + 5 PvP лимиты server-side | PASS | `backend` `TestRefillAndSpend_FreeDailyLimits` + `go run ./cmd/check` | — |
| 3 | Пасс ×2 и no-ads | PASS | `backend` `TestPassDoublesLimits_AndNoAds` | — |
| 4 | Гача pity срабатывает на hard 80 | PASS | `backend` `TestOpenJar_HardPityTriggersAt80` + `cmd/check` hard80; LiveOps `pity.hard=80` | — (weighted drop % / production pool — отдельно; StaticJarPool common→forced rare) |
| 5 | Нелегальный card play отвергается | PASS | `battle` `TestCreatePvP_SharesCore` (illegal unit → error) | — |
| 6 | Реплей PvP открывается | PASS | `battle/internal/replay` Store last-10 + `GetReplay`; client `ReplayListPresenter.OpenAsync` (GetReplay frames); `*` client `dotnet test` | — (если SKIP SDK — прогнать локально) |
| 7 | «Скоро» вкладки видны, не крашат | PASS* | `client` `HubPresenterTests` (Clans/Farm/Nursery Soon); `*` нужен `dotnet test` | — (если SKIP SDK — прогнать локально) |
| 8 | RU/EN переключение | PARTIAL | `content/i18n/ru_en.json` + `qa/gate` все ключи имеют `ru` и `en`; `DictionaryLocCatalog.Resolve(locale)`; **нет** UI switch / presenter SetLocale | Клиентский переключатель локали |
| 9 | IAP sandbox yarn → jar | PASS | `backend` `TestIAPSandbox_YarnThenJar` + `cmd/check`; sandbox validate → grant yarn → OpenJar | — (production store verify + priced SKU catalog — нет в SSOT/`shop.offers`) |
| 10 | LiveOps смена `limits` без ребилда клиента | PASS | `liveops` schema+validate; `qa/gate` мутация `limits` остаётся валидной; клиент читает `ILiveOpsSource` | — Wiring remote fetch в проде — отдельно |

## Итог soft-launch gate

**Не готов.** Закрыты автоматом: §13.2–§13.7, §13.9, §13.10 (+ client Replay/Soon при наличии .NET).  
Блокеров MUST больше нет. Частично: **§13.1** (нет туториала), **§13.8** (нет UI locale switch).

Out-of-scope SL (§1 MUST NOT — клан-босс / ферма / питомник геймплей) → не баги; «Скоро» (§13.7) ожидаемо.

## Ручной прогон (когда появится клиент Play)

См. `ЗАПУСК.md` §3. Для каждого PASS выше — smoke на устройстве. Баги → `BUG_TEMPLATE.md` с seed/replay.
