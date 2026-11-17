# Skill: hud-design-load

Загрузка / доводка экранов web-hud **по новому дизайну** (Stitch etalon → live form).  
Роли: `web-hud` + при импорте zip `stitch`; приёмка layout → `qa-ui`.  
Читать: этот скилл + `docs/skills/web-hud.md` (+ `stitch.md` если импорт).  
Не читать: Unity; полный FULL-SPEC; SEO/brand skill-паки.

## Правила задачи (LOCKED)

1. **Загружаем страницы с новым дизайном** — вендорить/встраивать Stitch HTML+ассеты в `client/web-hud/`, wire route · bind · stub. Эталон: inventory / `media/` / stitch-ref. Один экран (или один пак без overlap) на worker.
2. **Меню не правим** — `D-025` / `D-033` / `D-029`. Не менять `#appNav` / `#appSubTabs`, `NAV`, labels, порядок primary/subtabs, `docs/nav-ia.md`. Stitch per-screen header nav скрыть/не навигировать. Не «чинить меню» через экранный chrome.
3. **Остальное — по дизайну** — body/stage, CTA, панели, ассеты, empty/Soon stubs, bind `data-action` / ids. Механику и числа не выдумывать (FULL-SPEC / stubs). Soft-launch: farm/nursery/clan-boss live — только stub/Soon, если нет фазы 5+.
4. **Телефон = landscape only** — `D-036`. Playable UI на phone — горизонтально; portrait → rotate gate. **Не** писать portrait-first media queries и **не** дублировать CSS/gate: owner = **MF-145** (`bc-bc53c6b6-94ef-5491-a7c3-52b0ecb05363`, PR phone-landscape). Ссылайся на `D-036` / MF-145.

## Делать

- Gateway 0–7 (`antifailure-dev.mdc`) перед кодом.
- Импорт/патч формы: `mythfel-form` / `data-layout="landscape"`; flush filled, без site-footer.
- Route · `screenAddressFor` · alias · serve `index.html` · smoke (открыть → клик → tip/DOM).
- Доки smoke → Project `internal/` + `media/`.

## Не делать

- Менять IA меню / subtabs / `fillNav` ради экрана.
- Параллелить второй worker на тот же route/пак.
- Трогать `styles.css` portrait/orientGate / phone-landscape chrome (MF-145).
- Поднимать HUD без команды Andrew; полный реимпорт всех экранов «заодно».
- Клиент как SoT боя / наград.

## DoD

- Экран(ы) открываются с новым дизайном; меню визуально/IA как до патча.
- Интеграции: route + bind + одна smoke-проверка.
- Phone: зафиксировано в скилле/брифе как landscape (`D-036`); layout CSS gate — у MF-145, не в этом PR (если задача не MF-145).
