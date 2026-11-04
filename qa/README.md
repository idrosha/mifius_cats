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
Автогейт §13.1–§13.10 закрыт (client Tutorial/Locale/Replay/Soon при наличии .NET).

## DoD slice

- Чеклист 1:1 с FULL-SPEC §13
- Автогейты: limits/pass, pity hard80, IAP sandbox yarn→jar, illegal play, golden Двор, PvP replay, Tutorial &lt;10m, SetLocale RU/EN, LiveOps, i18n ru+en
- Client (`dotnet test`) — Tutorial + Locale + ReplayList + Soon; опционально SKIP без SDK
- Soft-launch **автогейт** зелёный; MANUAL Unity Play smoke остаётся вне авто

## Не пилит qa

Реализация фич (`battle/` replay, `backend/` economy), Unity UI, правка FULL-SPEC.
