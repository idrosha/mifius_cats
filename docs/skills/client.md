# Skill: client

Unity presenter. FULL-SPEC §6 §9 (§0 платформы).
- Bind to server stateDiff; never authoritative damage.
- Mobile-first hub + battle HUD; targets: mobile, web, PC/**Steam** (один проект).
- Soft-launch **browser** ручной тест = роль `web-hud` (`docs/skills/web-hud.md`), не этот скилл.
- Feature-flag «Скоро» tabs; no fake farm/boss gameplay.
- Cross-play: same net protocol; do not gate matchmaking by client platform.
Hotkeys/PC later. Localize via keys, not hardcoded RU.
No invented Steamworks/store APIs without an explicit task.
