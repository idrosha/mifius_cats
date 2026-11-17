# Practice dummies — battle cutouts (D-037)

Transparent full-body mannequins for **live practice fight only**.

| File | Role | SFX/anim kit |
|---|---|---|
| `dummy-oak-knight.png` | tank | `SoundFX.playTank` + idle/aura/hit/block |
| `dummy-straw-berserk.png` | fighter | `SoundFX.playFighter` + idle/aura/hit/block |
| `dummy-stone-totem.png` | support | `SoundFX.playSupport` + idle/aura/hit/block |

Lobby / practice-load keep studio JPGs under `../dummy-*.jpg`.
Wired via `CAT_HERO_BATTLE_ART` → `bot_practice_*` in `app.js`.
