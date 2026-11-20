# Skill: web-hud

Тонкий browser HUD поверх `devapi` для ручного теста Andrew.
- Код: `client/web-hud/**`. Не трогай Unity (`client` роль).
- HUD **не поднимать** без явной команды Andrew (prefs).
- IA/nav: `docs/nav-ia.md`; yard/trade layout — prefs (full-bleed map, hover plaques, trade plaza hub).
- **Меню locked:** при замене форм не менять `#appNav` / `#appSubTabs` / `NAV` (`D-025`, `D-033`, `D-029`).
- **Phone:** только landscape + rotate gate (`D-036`). Portrait-first UI запрещён. CSS/gate owner = **MF-145** — не дублировать, пока задача открыта.
- **Cat art (`D-037`):** без фона (`/stitch-assets/cat-heroes/battle/` + `catHeroBattleArt`) — **только** live fight HUD. На остальных формах — портреты с фоном (`catHeroArt`).
- **Facing (`D-047` / MF-170):** live/load board — слева → вправо, справа → влево (к центру). Вне боя: котики вправо. Один путь: `applySpriteFacing` / `.mf-sprite-face.is-flipped`. Новый арт → `*_NATIVE_FACE_LEFT` только если authored left.
- **Silhouette (`D-048`):** live cutouts — `--mf-role-h`/`--mf-role-w` by `data-role`: assassin/mage < ranger < support < fighter < tank; overall bump; monsters same role map; practice dummies keep Stitch wells (no D-048 bump/zoom); cats via art-well on `#pfAllies`. Lobby portraits — no role scale.
- **Fight FX (`MF-149` / `D-046`):** idle/aura/hit/block + Web Audio в `public/battle-fx.js` — practice / **PvE** / pvp / wire live fight; числа только из server `events`. **Idle breathe обязателен** для каждого живого cutout через `decorateBattleUnitIdle` (breathe+aura **одной** inline `animation` list — иначе aura class перетирает breathe). Ch3/ch4 baked monsters: breathe без aura.
- **Attack cards (`D-050`):** цельные webp-плашки; compose chrome / ручной aim — pause. `targetId:""`; backline на сервере.
- **Practice dummies:** cutouts `stitch-assets/dojo/battle/dummy-*.png` + те же role SFX/anim, что у tank/fighter/support котиков; load/lobby — JPG с фоном.
- **PvE live fight:** active Mythmir battle reuses `#viewPracticeFight` HUD (cutouts + hand + FX); chapter backdrop via `pveStageArt`. Painted `#viewPveFight` = stub chrome only.
- **PvE monsters (`MF-152`):** cutouts `stitch-assets/monsters/battle/{role}-*.png` via `battleUnitArt` / `monsterBattleArt`; FX = role kits из `battle-fx.js`.
- Загрузка новых дизайнов экранов → скилл `docs/skills/hud-design-load.md`.
- Stitch assets: потребляй уже импортированное; полный реимпорт/zip → роль `stitch`.
- Один bring-up / smoke за раз; не плодить параллельные Acceptance/Soft-launch HUD агенты.
- Доки/скрины smoke → Project `internal/` + `media/`, не копируй FULL-SPEC в ответ.
