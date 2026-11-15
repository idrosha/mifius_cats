# Журнал решений (ADR-lite)

Append-only. Новые записи — **сверху** (после шаблона). Id: `D-001`… монотонно.

## Правила журнала

1. **Пиши**, если: ломает альтернативу надолго, меняет UX/скоуп SL, спорили ≥2 варианта, или Andrew сказал «locked».
2. **Не пиши**: очевидный багфикс, локальный рефактор, чисто стилевой CSS без продукта.
3. Статусы: `Proposed` → `Accepted` / `Rejected` → `Superseded by D-xxx`.
4. `Accepted` по **механике** = обязателен патч `FULL-SPEC.md` (§) в той же задаче. Без патча — не Accepted.
5. `Accepted` по **продукту/процессу** (не бой) → достаточно этой записи + ссылка из `docs/DOCUMENTATION.md` / prefs при необходимости.
6. Одна запись = одно решение. Не смешивать баланс и IA в одном D-id.
7. В коде/доках ссылайся `D-0xx`, не копируй абзац Context.

## Шаблон (копировать)

```markdown
## D-0XX · YYYY-MM-DD · Краткий заголовок

- **Status:** Proposed | Accepted | Rejected | Superseded by D-0YY
- **Area:** battle | economy | hud | liveops | process | content
- **SSOT:** `docs/FULL-SPEC.md` §N | none
- **Owner:** @who

### Context
Что было неясно / какие варианты.

### Decision
Что выбрали (1–5 предложений).

### Consequences
Плюсы, минусы, follow-up задачи. Что *не* делаем.
```

---

## Индекс известных (до заведения журнала)

| Id | Тема | Где канон |
|---|---|---|
| D-001 | Единый цикл колоды draw/discard во всех режимах | FULL-SPEC §3 |
| D-024 | HP grid / gear color sets retune | `liveops/CHANGELOG.md`, wiki |
| D-026 | eyes/ears → active cards, N=6 | FULL-SPEC §2.3, `stitch-prompts-eyes-ears-active.md` |

*(Полные ADR для D-001…D-026 не восстанавливать задним числом — только индекс. Новые = полные записи ниже.)*

---

## D-031 · 2026-11-15 · Коллекция на SL = HUD stub + roster из профиля

- **Status:** Accepted
- **Area:** hud
- **SSOT:** docs/FULL-SPEC.md §6 (`collection`); §1 cap 15 / presets×5
- **Owner:** web-hud

### Context
Экран `collection` был пустой Stitch-оболочкой («Пусто»×12), с фейк БМ/рангом прайда/резонансом % вне FULL-SPEC; bind искал несуществующие `.roster-list`. Риск принять клиентский power за SoT.

### Decision
На SL коллекция = **HUD stub**: ростер из `profile.cats` (как home — shop×12, D-027; farm вне боевого грида); 1 активный пресет 3v3 local (+ persist); фильтры роль/поиск. Без client SoT урона/наград. БМ / «резонанс %» / «Ранг V прайда» — не показывать как live. Cap 15 и presets[5] — в stub-модели; серверный SavePreset — later. Каталог: `collection-stub.json` + `GET /api/dev/collection`.

### Consequences
+ Можно смоук-тестить отряд/ростер. − Пресеты не SoT боя до backend. Follow-up: SavePreset RPC; 5 пресетов UI.

---

## D-030 · 2026-11-15 · Скрещивание на SL = HUD stub

- **Status:** Accepted
- **Area:** hud
- **SSOT:** docs/FULL-SPEC.md §4.4.1, §6 (`breeding`)
- **Owner:** web-hud

### Context
Экран `breeding` (Stitch altar) выглядел как live nursery: фейковый шанс %, мифик-родители, инкубатор/claim, мёртвый wiring (`data-action` ≠ bind). Риск принять клиентский roll/награду за SoT вопреки §4.4.1 (Phase 6 server).

### Decision
На SL скрещивание = **HUD stub**: форма алтаря + tip core fantasy; выбор родителей из локального roster; mats/incubator = Soon; CTA → gate tip («Подними ранг» / «Скоро»). **Нет** client SoT шанса/колоды/котёнка. Live breed / RPC / LiveOps `nursery_mythic_chance` — Phase 6. Каталог stub: `breeding-stub.json` + `GET /api/dev/breeding` (не экономика).

### Consequences
+ Можно доводить UX питомника без backend. − Числа на экране не SoT. Copy везде **N=6** (§4.4.1). Follow-up: `nursery_gameplay` + Breed RPC.

---

## D-029 · 2026-11-15 · Один chrome `#appNav` + IA = NAV

- **Status:** Accepted
- **Area:** hud
- **SSOT:** docs/FULL-SPEC.md §6 (Hub chrome); docs/nav-ia.md
- **Owner:** web-hud

### Context
На hub Stitch-header дублировал меню, прятал `#appNav`, показывал фейковый wallet/VIP. FULL-SPEC §6 primary расходился с каноном `NAV` / `nav-ia.md`. Дефолт «Дом Хранителя» вёл в Soon-farm.

### Decision
Один chrome: `#appNav` / `#appSubTabs` на всех soft-launch экранах включая hub. IA primary = текущий `NAV` (СЕЗОН / МИФМИР / ДОМ / БОИ / ТОРГОВЛЯ / ГИЛЬДИЯ); §6 патчим под него. Дефолт Дома = `home`; Бои = `pvp`. Wallet в шапке из profile/wallet stub (не SoT). Dev LiveOps/Battle pills — не player chrome. Распил «Гильдия» и server unlocks — later.

### Consequences
+ Нет второго меню на hub. − Хаб-бар Stitch не эталон навигации. Follow-up: server feature flags (P3); распил чатов/рейтингов в отдельные primary.

---

## D-028 · 2026-11-15 · Склад на SL = HUD stub

- **Status:** Accepted
- **Area:** hud
- **SSOT:** docs/FULL-SPEC.md §6 (экран Склад `gear`); note §7.1 HUD slots ≠ pendant/bow
- **Owner:** web-hud

### Context
Нужен рабочий экран Склад (`gear` / barn) для ручного smoke без Unity. Серверный inventory / Nakama ещё не задача soft launch. Риск: принять local `gearCatalog`/`barn*` за экономику или выдать стартовый экип вопреки §5.1.

### Decision
На SL склад = **HUD stub**: фильтры, вместимость UI, inspect, надеть/снять на кота через общие `equipItem`/`unequipSlot`. Каталог локальный. Серверный inventory — отдельная backend-задача. Стартовый pendant/bow не выдаём (§5.1). «Склад алхимика» / farm mats loop — не этот экран (Phase 6).

**Model note:** HUD stub slots (`helm`/`armor`/`cloak`/…) — презентация smoke; SSOT экипа боя = `pendantId` + `bowByPart` (§7.1). Клиентский экип **не** SoT урона/наград.

### Consequences
+ Можно доводить UX склада без бэкенда. − Числа cap/статов не SoT. Rules: `.cursor/rules/web-hud-gear.mdc`, `docs/nav-ia.md`. Backend inventory = follow-up (не SL).

---

## D-027 · 2026-11-15 · Home roster = 12 shop + фильтр по 6 ролям

- **Status:** Accepted
- **Area:** hud
- **SSOT:** none (презентация; каталог 6×2 = wiki / content)
- **Owner:** web-hud

### Context
Тестовый грант давал 3 starter + 12 shop → в «ВЫБОР ПЕРСОНАЖА» 15 строк и дубли артов. Вкладки «Танк / ДПС / Саппорт» не покрывали 6 классов.

### Decision
Ростер дома показывает только `shop_*` (12). Фильтры: Все, Танк, Бойцы, Убийцы, Стрелки, Маги, Саппорт. Стартеры остаются в профиле для боя как twins.

### Consequences
Счётчик «Герои: 12» совпадает с Базой знаний. Коллекция/grant по-прежнему может показывать 3+12+farm — отдельное решение, если урезать грант.
