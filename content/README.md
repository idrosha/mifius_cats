# Mythfel content (Phase 1 slice)

Минимальный набор по `ЗАПУСК.md` Step B / content + `docs/FULL-SPEC.md` §2 §7.2–7.3 §10.

| Путь | Содержимое |
|---|---|
| `cards/` | CardDef стартеров (4× tank/fighter/support) + backline-атаки mage/ranger (§3.4) |
| `parts/` | PartDef стартеров (eyes/ears пассивы; muzzle/headwear/back/tail → карты) |
| `cats/starters.json` | 3 боевых стартера: tank·stone, fighter·fire, support·water (equal decks / fair PvP — §2.1, §5.1) |
| `stages/test_yard_1.json` | Тестовый узел Двора для golden replay |
| `i18n/ru_en.json` | name_key RU+EN |

Числа `baseStats` и сила карт — Phase 1 defaults (§16), не отдельный баланс LiveOps.

**Starter grant (SSOT §5.1 / §10) — content notes:**
- Боевые стартеры: фиксированные `templateId` + части → карты; кит **одинаков у всех новых игроков** (без RNG).
- Follow-up: `cats` template `starter_farm_grass` (инвентарь, без crop на SL); `potions/*.json` для 6 id (`potion_life` … `potion_mint`).
- Не выдавать pendant/bow в стартовом контенте.
