# Gear color sets (batches 1–5)

Slot model: **helm · armor · cloak · boots · weapon · shield(offhand) · belt · ring**.

Combat scale (tank HP=50, card hit ≈5–6): armor → flat **DEF/HP**; weapons → modest **ATK +2…+4**; rings → modest HP/DEF (+ optional ATK/SPD/crit).

## Armor (5/5 totals)
| Set | Rank | DEF | HP | ATK | 3+ set |
|---|---|---|---|---|---|
| grey | R1 | +6 | +8 | 0 | +1 DEF |
| green | R2 | +8 | +10 | +1 | +1 ATK |
| turquoise | R3 | +9 | +11 | +1 | +1 SPD |
| yellow | R4 | +11 | +13 | +2 | +1 ATK |
| purple | R5 | +12 | +14 | +2 | +1 crit |
| red | R6 | +14 | +16 | +2 | +2 HP |

Armor pieces: all heroes. Use `equipArmorSet(catId, setId)` in HUD stub.

## Rings (all heroes, `roles: null`)
| id | Set | Bonuses |
|---|---|---|
| grey_ring | grey | +1 HP · +1 DEF |
| green_ring | green | +1 HP · +1 DEF · +1 SPD |
| turquoise_ring | turquoise | +2 HP · +1 DEF |
| yellow_ring | yellow | +1 ATK · +1 HP · +1 DEF |
| purple_ring | purple | +1 ATK · +1 HP · +1 DEF · +1 crit |
| red_ring | red | +1 ATK · +2 HP · +1 DEF |

Thumbs: `thumbs/*-ring.png`. Full art: Project `media/gear-rings/`.

## Class weapons (ATK band)
| Class | Kit | ATK |
|---|---|---|
| tank | mace / spear + large or small shield | weapon +2; shields +3…+4 DEF |
| fighter | greatsword or dual axes | +4 / +2+2 |
| assassin | dual daggers | +2+2 |
| ranger | bow or crossbow + arrows | +2 / +2 / +1 |
| mage | yellow 2H staff or 1H wand + book | +3 / +2 / +1 |
| support | turquoise staff + scroll | +2 / +1 DEF |

Full art: Project `media/gear-sets-batch{1,2,3,4,5}/`.
