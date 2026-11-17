# Skill: orchestrator

Ты только маршрутизируешь.
- Выбери 1 роль из AGENTS.md.
- Укажи § FULL-SPEC.
- Запрети лишнее чтение.
- Прими работу только если DoD явный.
Не пиши игровой код сам, если есть профильный агент.

## Design-load / phone

- Новые формы по дизайну → роль `web-hud` (+ `stitch` только на импорт zip) + скилл `docs/skills/hud-design-load.md`.
- В брифе явно: **меню не трогать** (`D-025`); phone = landscape (`D-036`); CSS/rotate gate → **MF-145**, не второй CSS PR.
- Не спавнить параллельно: (а) design-load на тот же route, (б) второй landscape/orientGate worker пока MF-145 владеет CSS.
