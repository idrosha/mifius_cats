# Cat heroes v2 — shipped to main

Idle ×18 влиты в `client/web-hud/public/stitch-assets/cat-heroes/`.

## Маппинг пород → боевые стихии

| Idle art (порода) | Combat element | Файлы live |
|---|---|---|
| `*-fire.jpg` (рыжий) | `fire` | `tank-fire.jpg` … |
| `*-ice.jpg` (персидский) | `water` | `tank-water.jpg` … |
| `*-stone.jpg` (британский) | `wind` | `tank-wind.jpg` … |

## Промпты

- base / матрица 18: [`../stitch-prompts-cat-heroes-v2-18.md`](../stitch-prompts-cat-heroes-v2-18.md)
- карточки + экип + анимация: [`../stitch-prompts-cat-heroes-v2-cards-equip-anim.md`](../stitch-prompts-cat-heroes-v2-cards-equip-anim.md)

## Обычные / мифические

| Набор | Путь | Что |
|---|---|---|
| Обычные | `idle/{role}-{element}.jpg` | без glow |
| Мифические | `idle/mythic/{role}-{element}.jpg` | со свечением после скрещивания |

Галерея: [`idle-gallery.html`](idle-gallery.html) — вкладки **Обычные / Мифические**.

## Shipped gear18 (ordinary)

- Lobby + battle: `client/web-hud/public/stitch-assets/cat-heroes/` (+ `battle/`)
- Cache: `?v=gear18c` in `app.js` (`CAT_HERO_ART` / `CAT_HERO_BATTLE_ART`)
- Studio cutouts: `cat-heroes/studio/` (без таверны)
- Lobby idle = studio + `bg/tavern-shared.jpg` (очаг на портретах)
- Battle = studio без таверны; page wallpaper = `bg/tavern-shared-wide.jpg`

## Next

1. True transparent PNG cutouts (D-037) если нужен альфа-канал
2. Gear overlays (paper-doll)
3. Attack sprite sheets
4. Подключить mythic-арт к nursery / rarity mythic

