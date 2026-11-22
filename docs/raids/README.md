# Рейды / Легион 12 — пакет дизайна

**Статус пайплайна (2026-11-22): gate G1–G7 PASS; E2E легион-sim ещё stub (узлы = CreatePvE 3v3).**

| Предусловие | Статус |
|---|---|
| Лобби UI `boss_raid` (painted) | есть (Мяурра + `#raidPathPanel`) |
| Путь short·long | голосование на форме боя после 1-го отряда (не в лобби) |
| Стейджи 3 дизайн-рейдов | есть (`raid_*` ×12 + `raids_sl.json`) |
| Уникальный арт монстров 3 рейдов | есть (3 pitboss + 6 аддов) |
| LiveOps weekly lock / attempts | есть |
| Строй 12 + валидация состава | есть (`formationMode=raid`, `viewRaidBattle` stub) |
| Превью доски 4×3 до боя | есть — **ждёт твой дизайн боя** |
| Узлы пути → CreatePvE + лут stub | есть |
| Полный 12-player shared HP / split rooms | **ещё нет** (после дизайна боя) |

Канон спеки: рейд/легион **8–12**, отдельно от данжа 4×3 и соло-Мифмира (`FULL-SPEC` §4 / `boss_raid` в nav).

## Документы

| Файл | Содержание |
|---|---|
| [RAID-01-myaurra.md](./RAID-01-myaurra.md) | Небесный Двор Мяурры |
| [RAID-02-talass.md](./RAID-02-talass.md) | Бездна Шепчущих Усов |
| [RAID-03-vulcan.md](./RAID-03-vulcan.md) | Пепельный Трон Девяти Хвостов |
| [PATHS-COMPARE.md](./PATHS-COMPARE.md) | Сравнение коротких/длинных путей |
| [COMPOSITION.md](./COMPOSITION.md) | Состав 3T/3S/6DPS · строй 4×3 · таймер хода 60с |
| [../../qa/RAID_ACCEPTANCE.md](../../qa/RAID_ACCEPTANCE.md) | Тест-план + текущий PASS/FAIL |

## Организация 12 (общая)

Рейд ≠ «×4 данжа». Нужны одновременные действия **≥2 групп** (секторы / экипажи / сплит-комнаты).

Целевой коридор килла: **20–30 мин** (короткий ≤22, длинный ≤30).

## Разблокировка playtest

1. Контент: `content/stages/raid_*` + фракции/боссы под 3 рейда (или временно реюз D-039 с пометкой stub).
2. HUD: лобби 12 → входной отряд → голосование short/long на форме боя → fight/win skin.
3. Battle/backend: shared HP / soak min-count / split rooms / weekly lock.
4. Арт: cutouts боссов + аддов по локациям.
5. Затем — полный прогон `qa/RAID_ACCEPTANCE.md`.
