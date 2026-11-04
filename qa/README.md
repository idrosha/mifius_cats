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
BLOCKED MUST закрыт. PARTIAL: §13.1 tutorial, §13.8 locale UI.

## DoD slice

- Чеклист 1:1 с FULL-SPEC §13
- Автогейты: limits/pass, pity hard80, IAP sandbox yarn→jar, illegal play, golden Двор, PvP replay store+GetReplay, LiveOps, i18n ru+en
- Client (`dotnet test`) — ReplayList open + Soon; опционально, если есть SDK
- Soft-launch gate **не** зелёный, пока PARTIAL по MUST §13.1 / §13.8

## Не пилит qa

Реализация фич (`battle/` replay, `backend/` economy), Unity UI, правка FULL-SPEC.
