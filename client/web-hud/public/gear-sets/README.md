# Gear color sets (R1–R8 · PvP × PvE)

Slot model: **helm · armor · cloak · belt · boots · ring** + class **weapon** / tank **shield**.  

**Lanes:** each set exists as **PvP** (shop) and **PvE** (`pve_` copies).  
**Earn:** battle pass grants one full set for a cat; PvE / dungeons / raids drop pieces + runes at low chance.  
**Enhance:** forge with runes — fail consumes rune, never burns the item.  
**Ranks:** **R1–R8** (wiki §8.5). Art prompts: `docs/stitch-prompts-pve-pvp-gear-sets.md`.  
**Stock (HUD stub):** smoke seed stocks `qty` **×18** (stack cap); battle pass / drops / shop still add copies. Gear is the CP key.  
Combat: monster HP is fixed; higher DEF makes PvE easier (wiki §4.3).

Combat scale (tank HP=50, card hit ≈5–6): armor → flat **DEF/HP**; rings → modest HP/DEF (+ optional ATK/SPD/crit).

## Armor (5/5 totals)
| Set | Rank | DEF | HP | ATK | 3+ set | KB ref |
|---|---|---|---|---|---|---|
| grey | R1 | +6 | +8 | 0 | +1 DEF | r1-steel |
| green | R2 | +8 | +10 | +1 | +1 ATK | r2-ranger |
| blue *(HUD alias turquoise)* | R3 | +9 | +11 | +1 | +1 SPD | r3-blue |
| yellow | R4 | +11 | +13 | +2 | +1 ATK | r4-lion |
| purple | R5 | +12 | +14 | +2 | +1 crit | r5-purple |
| red | R6 | +14 | +16 | +2 | +2 HP | r6-dragon |
| solar | R7 | +15 | +18 | +3 | +1 ATK | r7-solar |
| or | R8 | +17 | +20 | +3 | +2 DEF | r8-or-fullplate |

Armor pieces: all heroes. Use `equipArmorSet(catId, setId)` in HUD stub.  
Seed builder: `client/web-hud/public/gear-catalog-seed.js`.

## Rings (all heroes, `roles: null`)
| id | Set | Bonuses |
|---|---|---|
| grey_ring | grey | +1 HP · +1 DEF |
| green_ring | green | +1 HP · +1 DEF · +1 SPD |
| blue_ring | blue | +2 HP · +1 DEF |
| yellow_ring | yellow | +1 ATK · +1 HP · +1 DEF |
| purple_ring | purple | +1 ATK · +1 HP · +1 DEF · +1 crit |
| red_ring | red | +1 ATK · +2 HP · +1 DEF |
| solar_ring | solar | +1 ATK · +2 HP · +1 DEF |
| or_ring | or | +1 ATK · +2 HP · +1 DEF · +1 crit |

Thumbs: `thumbs/{set}-{slot}.png`. Overlays (paper-doll): `gear-sets/{pvp|pve}/{set}/{slot}.png`.
