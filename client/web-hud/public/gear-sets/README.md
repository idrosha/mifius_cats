# Gear color sets (batch 1)

Live HUD icons for character (`/hero`) and warehouse (`/barn`).  
`thumbs/` = 256² for slots/cards. Full 1024² art lives in Project media `gear-sets-batch1/`.

| File | Set | Slot | Class |
|---|---|---|---|
| `grey-helm.png` | серый | helm | all |
| `grey-armor.png` | серый | armor | all |
| `grey-boots.png` | серый | boots | all |
| `yellow-cloak.png` | жёлтый | armor | all |
| `yellow-belt.png` | жёлтый | belt | all |
| `yellow-staff.png` | жёлтый | weapon | mage |
| `turquoise-staff.png` | бирюзовый | weapon | mage |
| `red-helm.png` | красный | helm | all |
| `red-armor.png` | красный | armor | all |
| `green-crossbow.png` | зелёный | weapon | ranger |

**Not in batch 1:** purple set; tank mace/shield; fighter/assassin/support weapons; remaining armor slots (gloves/ring/…) per color.

HUD paths: `/gear-sets/<file>.png`, `/gear-sets/thumbs/<file>.png`.
Catalog: `app.js` → `gearCatalog` / `barnCatalog` (`roles` gate on weapons).
