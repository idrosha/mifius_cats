# mythfel-client (ЗАПУСК Step C)

Unity-oriented **presenter** к бою. Source of truth боя — `battle/` (§3 / §8.2); клиент только input + отображение `stateDiff`.

## Раскладка (§9)

Логика презентера живёт в `src/Mythfel.Client/` (компилируемый .NET 8 classlib). В Unity-проекте те же модули лягут в:

```
Assets/Game/Battle/   ← BattlePresenter, StateDiff, ViewState
Assets/Game/Net/      ← IBattleNetClient stubs
Assets/Game/Data/     ← Loc (name_key)
Assets/Game/UI/       ← IBattleHudView контракт HUD §6
```

Этот slice **не** тянет UnityEngine: собирается без Editor.

## DoD slice

- `BattlePresenter.ApplyStateDiff` биндит HUD (board 3+3, hand, energy, milk, keep, potions, result)
- Нет локального расчёта урона/наград
- Действия уходят в `IBattleNetClient.SubmitAction` → ответный `stateDiff`
- Локализация через `name_key`, не хардкод RU
- `dotnet test` зелёный

```bash
cd client
dotnet test
```

## Не в этом PR

Hub/Shop, Nakama auth, Addressables-арт, hotkeys PC, ферма/клан-босс.
