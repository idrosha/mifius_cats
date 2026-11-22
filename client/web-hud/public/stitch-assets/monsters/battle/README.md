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
`fighter-h` = обычный пёс (dual clubs), pixel-authored facing **left** + `MONSTER_NATIVE_FACE_LEFT` (locked). Do not map ch1 to `fighter-b` — that red dual-axe plate is ch3.
Ch2 wolves → RGBA `wolf-*-cutout.webp` (tank/fighter/support/pitboss). Do not reintroduce RGB studio plates.
`wolf-support-cutout` (Шаман инея) pixel-authored facing **left** + `MONSTER_NATIVE_FACE_LEFT` (locked).
Ch3 red dogs → RGBA `redd-*-cutout.webp` (shield tank / dual-axe fighter / flaming-sickle support / flaming-sword pitboss). All four listed in `MONSTER_NATIVE_FACE_LEFT`. `redd-tank` / `redd-fighter` / `redd-pitboss` (Алый Вожак) re-baked pixel-LEFT; support already left.
Ch4 zombies → RGBA `zombie-*-cutout.webp` (axe tank / cleaver fighter / dagger support / scythe pitboss).
Ch5 ghosts → RGBA `ghost-*-cutout.webp` (flail-shield tank / scimitar fighter / shaman support / banner-sword pitboss).
Raid factions (`docs/raids`, 2026-11-22) → PNG cutouts + JPG masters:
- `solar_lions` — `solar-lion-{tank,fighter}-cutout` · pitboss `myaurra-pitboss-cutout` (Мяурра)
- `deep_lynxes` — `deep-lynx-{tank,support}-cutout` · pitboss `talass-pitboss-cutout` (Таласс)
- `kitsune_ash` — `kitsune-{fighter,support}-cutout` · pitboss `vulcan-pitboss-cutout` (Вулкан)
Template hints: `pitboss_myaurra` / `bot_solar_*`, `pitboss_talass` / `bot_lynx_*`, `pitboss_vulcan` / `bot_kitsune_*`.
Load/fight backdrops: `pve-load/chapter-2-frost.webp` + `pve-fight/ch2-{entrance,tunnel,boss}.webp` (order locked).
See `manifest.json` for source UUID → file map (Mythmir pool); raid PNGs wired in `MONSTER_BATTLE_BY_FACTION`.

Coop dungeon bosses (`docs/dungeons-coop-3.md`): alias cutouts `dungeon-{scarlet,howl,whisper}-boss-cutout*` (+ whisper-echo). Wired by `DUNGEON_BOSS_BATTLE_ART` when templateId contains `dungeon_scarlet|howl|whisper`.

