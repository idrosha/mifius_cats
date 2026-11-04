# mythfel-client (ЗАПУСК Step C)

Unity-oriented **presenter** слой. Source of truth боя — `battle/` (§3 / §8.2); economy/IAP — сервер (§8.3). Клиент только input + отображение `stateDiff` / LiveOps.

## Раскладка (§9)

Логика презентера живёт в `src/Mythfel.Client/` (компилируемый .NET 8 classlib). В Unity-проекте те же модули лягут в:

```
Assets/Game/Battle/   ← BattlePresenter, StateDiff, ViewState
Assets/Game/Meta/     ← HubPresenter, ShopPresenter, ReplayListPresenter, TutorialPresenter, Soon sheets
Assets/Game/LiveOps/  ← LiveOpsConfig + Stub/HttpLiveOpsSource + SoftLaunchGeo
Assets/Game/Net/      ← IBattleNetClient stubs (CreatePvE / SubmitAction / ListReplays / GetReplay)
Assets/Game/Data/     ← Loc (name_key) + CurrentLocale / SetLocale
Assets/Game/UI/       ← IBattleHudView / IHubView / IShopView / IReplayListView / ITutorialView
```

Этот slice **не** тянет UnityEngine: собирается без Editor.

## DoD slice

- `BattlePresenter.ApplyStateDiff` биндит HUD (board 3+3, hand, energy, milk, keep, potions, result)
- `HubPresenter` — вкладки §6 (Двор · PvP · Коллекция · Магазин · Кланы · Ещё); «Скоро» по `feature_flags`; `SetLocale` RU/EN (§13.8)
- `TutorialPresenter` — starters → CreatePvE `test_yard_1` → `p1_win` &lt;10 мин (§13.1); `tutorial_step` ids
- `ShopPresenter` биндит `shop.offers` из LiveOps; пустой каталог → пустой UI (без выдуманных цен)
- `ReplayListPresenter` — список ≤10 PvP + `OpenAsync` через GetReplay frames (§13.6)
- `HttpLiveOpsSource` — Boot fetch с CDN stub (`X-LiveOps-Signature: stub`); `SoftLaunchGeo` + `soft_launch_flag` (§11/§14)
- Нет локального расчёта урона/наград/цен
- Локализация через `name_key`, не хардкод RU
- `dotnet test` зелёный

```bash
cd client
dotnet test
```

## LocalSmoke (ручной runnable path без Unity)

Console-хост presenter+hub+battle против локальных stubs. How-to: `qa/DEVICE_SMOKE.md` §0.

```bash
# из корня репо (поднимает CDN :8090 + battle/devapi :8081 + LocalSmoke)
../qa/run-local-smoke.sh

# или только stub payloads:
dotnet run --project tools/Mythfel.LocalSmoke -- --stub-only
```

`HttpBattleNetClient` → `battle/cmd/devapi` (§8.2 CreatePvE / SubmitAction / replay).  
Unity Hub Play Mode — когда появится отдельный Unity-проект; этот slice его не содержит.

## Web HUD (браузер, без Unity / WebGL)

Тонкий HTML/JS для ручного PvE Двор / туториал против тех же stubs:

```bash
../qa/run-web-hud.sh
# или: cd web-hud && node server.mjs   # после CDN :8090 + battle :8081
```

How-to: `web-hud/README.md`.

## Не в этом PR

Nakama auth, Addressables-арт, Unity scene/Play Mode, hotkeys PC, фейковый геймплей фермы/клан-босса, IAP checkout UI, production CDN signature verify.
