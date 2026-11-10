# Skill: merge-ci

Merge готового PR в `main` после зелёного CI.
- Prefs: готовые PR мержить сразу; пуш от idrosha не обязателен.
- Не переписывай фичу и не открывай новый scope.
- Один merge-агент на один PR. Если CI красный — короткий отчёт, не silent force-merge.
- После merge — короткое подтверждение (PR URL + commit); архивируй one-shot worker.
