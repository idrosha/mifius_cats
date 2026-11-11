# Gear color sets (batch 1–2)

Live HUD icons for character (`/hero`) and warehouse (`/barn`).  
`thumbs/` = 256² for slots/cards. Full 1024² art: Project media `gear-sets-batch1/` + `gear-sets-batch2/`.

## Armor (all heroes)

| File | Set | Slot |
|---|---|---|
| `grey-helm/armor/boots` | серый | helm / armor / boots |
| `yellow-helm/cloak/belt` | жёлтый | helm / armor / belt |
| `red-helm/armor/cloak/belt/boots` | красный | helm / armor×2 / belt / boots |
| `purple-helm/armor/cloak/belt/boots` | фиолетовый | helm / armor×2 / belt / boots |
| `green-helm/armor/cloak/belt/boots` | зелёный | helm / armor×2 / belt / boots |

## Weapons (class-gated)

| File | Set | Class |
|---|---|---|
| `yellow-staff.png` | жёлтый | mage |
| `turquoise-staff.png` | бирюзовый | mage |
| `green-crossbow.png` | зелёный | ranger |

**Still missing:** turquoise armor pieces; tank mace+shield; fighter/assassin/support weapons; gloves/rings.

HUD paths: `/gear-sets/thumbs/<file>.png`. Catalog: `app.js` → `gearCatalog` / `barnCatalog`.
