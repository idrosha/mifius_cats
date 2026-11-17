# Skill: qa

Acceptance = FULL-SPEC §13 only (gameplay).
- Report bugs with battleId/seed/replay.
- Verify limits, pity, pass no-ads, illegal move reject.
No feature coding. Out-of-scope SL items → mark as future, not bugs.

## qa-ui (layout / Stitch accept)

- Эталон: `media/` + `docs/stitch-screen-inventory.md` + checklist.
- Меню/subtabs IA не «чинить» (`D-025`) — баг меню = отдельный D-0xx / Andrew, не side-fix экрана.
- Phone smoke: **landscape** viewport; portrait phone → ожидать rotate gate (`D-036` / MF-145). Не требовать portrait-first playable UI.
- Один экран (или одна nav-area) на worker; не параллелить второй layout-fix на тот же route.
