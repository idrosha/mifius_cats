# mythfel-qa — приёмка soft launch (§13)

Роль: `qa`. SSOT: `docs/FULL-SPEC.md` §13 (+ §1 скоуп, §11 события — только для контекста багов).  
Скилл: `docs/skills/qa.md`. **Не** пилит фичи.

| Артефакт | Назначение |
|---|---|
| `ACCEPTANCE.md` | Чеклист §13.1–§13.10 + статус Auto / Manual / Blocked |
| `run-acceptance.sh` | Харнесс: прогон существующих пакетов + `gate/` |
| `gate/` | Узкие Go-проверки SSOT-чисел/i18n (без новой механики) |
| `BUG_TEMPLATE.md` | Шаблон бага с battleId / seed / replay |

```bash
# из корня репо
./qa/run-acceptance.sh
```

Ожидание: exit `0` если все **запускаемые** автогейты зелёные.  
Пункты §13 без реализации (pity RNG, IAP, PvP replay UI) → `BLOCKED` в отчёте, не fail и не «баг фичи».

## DoD slice

- Чеклист 1:1 с FULL-SPEC §13
- Автогейты на текущий код: limits/pass, illegal play, golden Двор, LiveOps pity/limits/flags, i18n ru+en
- Client (`dotnet test`) — опционально, если есть SDK
- Soft-launch gate **не** зелёный, пока есть BLOCKED по MUST §13

## Не в этом PR

Реализация pity/IAP/replay/tutorial, Unity UI, правка FULL-SPEC.
