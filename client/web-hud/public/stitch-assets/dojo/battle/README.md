# Practice dummies — battle cutouts (D-037)

Transparent full-body mannequins for **live practice fight only**.

| File | Role | SFX/anim kit |
|---|---|---|
| `dummy-oak-knight.png` (+ `.webp`) | tank | `SoundFX.playTank` + idle/aura/hit/block |
| `dummy-straw-berserk.png` (+ `.webp`) | fighter | `SoundFX.playFighter` + idle/aura/hit/block |
| `dummy-stone-totem.png` (+ `.webp`) | support | `SoundFX.playSupport` + idle/aura/hit/block |

HUD primary path is **PNG** (`?v=dummyfix1`); WebP is an onerror fallback. Masters in `_src/`.
Lobby / practice-load keep studio JPGs under `../dummy-*.jpg`.
Wired via `CAT_HERO_BATTLE_ART` → `bot_practice_*` in `app.js`.
