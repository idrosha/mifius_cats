# Skill: stitch

Промпты Google Stitch и/или импорт HTML/ассетов в web-hud.
- Пиши промпты в `docs/stitch-*.md`; держи inventory в `docs/stitch-screen-inventory.md`.
- Импорт: только **публичный** share с Download All или zip. Private project-ссылка с Google login — агент файлы не достанет (prefs).
- Layout: **landscape** 16:9, flush filled, без site-footer (`data-layout="landscape"`). Phone playable = landscape (`D-036`); portrait gate — MF-145, не этот скилл.
- После импорта формы: **не** править shared menu/submenu chrome (`D-025`). Stitch header nav скрыть.
- Один пак / один набор экранов = один worker. Не параллель второй пак на те же route.
- Design-load handoff → `docs/skills/hud-design-load.md` (wire/bind делает `web-hud`).
- После импорта не рестарти HUD и не крути мелкие фиксы, пока Andrew не попросил Try Live со свежего `main`.
- Layout accept vs etalon → `qa-ui`, не этот скилл.
