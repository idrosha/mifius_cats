# PvE monster heroes — battle cutouts (MF-152 / D-037)

Transparent full-body monsters for **live PvE fight HUD only** (`#viewBattle`).
Lobby / yard map keep non-cutout art. Anim + SFX reuse cat **role** kits via `battle-fx.js`.

| Role | Files | Soft-launch stages |
|---|---|---|
| tank | `tank-a`…`tank-d` | mythmir `*_dummy_tank_*` |
| fighter | `fighter-a`…`fighter-h` | `*_dummy_fighter_*`, pitboss center |
| support | `support-a`…`support-c` | `*_dummy_support_*` |
| assassin | `assassin-a`…`b` | reserved (role pool) |
| ranger | `ranger-a`…`b` | reserved |
| mage | `mage-a` | reserved |

Wiring: `monsterBattleArt` / `battleUnitArt` in `app.js` — **faction pools** (`MONSTER_BATTLE_BY_FACTION`, D-039) then role fallback; stable pick by `templateId` hash.
Ch1 dogs → grey armored cutouts (`tank-b` / `fighter-h` / `ranger-a`, pitboss `tank-d`).
Ch2 wolves → `wolf-tank` / `wolf-fighter` / `wolf-support`, pitboss `wolf-pitboss`.
Load/fight backdrops: `pve-load/chapter-2-frost.png` + `pve-fight/ch2-{entrance,tunnel,boss}.png` (order locked).
See `manifest.json` for source UUID → file map.

