# Skill: web-hud

Тонкий browser HUD поверх `devapi` для ручного теста Andrew.
- Код: `client/web-hud/**`. Не трогай Unity (`client` роль).
- HUD **не поднимать** без явной команды Andrew (prefs).
- IA/nav: `docs/nav-ia.md`; yard/trade layout — prefs (full-bleed map, hover plaques, trade plaza hub).
- **Меню locked:** при замене форм не менять `#appNav` / `#appSubTabs` / `NAV` (`D-025`, `D-033`, `D-029`).
- **Phone:** только landscape + rotate gate (`D-036`). Portrait-first UI запрещён. CSS/gate owner = **MF-145** — не дублировать, пока задача открыта.
- Загрузка новых дизайнов экранов → скилл `docs/skills/hud-design-load.md`.
- Stitch assets: потребляй уже импортированное; полный реимпорт/zip → роль `stitch`.
- Один bring-up / smoke за раз; не плодить параллельные Acceptance/Soft-launch HUD агенты.
- Доки/скрины smoke → Project `internal/` + `media/`, не копируй FULL-SPEC в ответ.
