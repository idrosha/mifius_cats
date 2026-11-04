# mythfel-client (ЗАПУСК Step C)

Unity-oriented **presenter** слой. Source of truth боя — `battle/` (§3 / §8.2); economy/IAP — сервер (§8.3). Клиент только input + отображение `stateDiff` / LiveOps.

## Раскладка (§9)

Логика презентера живёт в `src/Mythfel.Client/` (компилируемый .NET 8 classlib). В Unity-проекте те же модули лягут в:

```
Assets/Game/Battle/   ← BattlePresenter, StateDiff, ViewState
Assets/Game/Meta/     ← HubPresenter, ShopPresenter, ReplayListPresenter, Soon sheets
Assets/Game/LiveOps/  ← LiveOpsConfig mirror + ILiveOpsSource
Assets/Game/Net/      ← IBattleNetClient stubs (SubmitAction / ListReplays / GetReplay)
Assets/Game/Data/     ← Loc (name_key)
Assets/Game/UI/       ← IBattleHudView / IHubView / IShopView / IReplayListView
```

Этот slice **не** тянет UnityEngine: собирается без Editor.

## DoD slice

- `BattlePresenter.ApplyStateDiff` биндит HUD (board 3+3, hand, energy, milk, keep, potions, result)
- `HubPresenter` — вкладки §6 (Двор · PvP · Коллекция · Магазин · Кланы · Ещё); «Скоро» по `feature_flags`
- `ShopPresenter` биндит `shop.offers` из LiveOps; пустой каталог → пустой UI (без выдуманных цен)
- `ReplayListPresenter` — список ≤10 PvP + `OpenAsync` через GetReplay frames (§13.6)
- Нет локального расчёта урона/наград/цен
- Локализация через `name_key`, не хардкод RU
- `dotnet test` зелёный

```bash
cd client
dotnet test
```

## Не в этом PR

Nakama auth, Addressables-арт, hotkeys PC, фейковый геймплей фермы/клан-босса, IAP checkout UI.
