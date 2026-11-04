# Skill: backend

Nakama + economy RPCs. FULL-SPEC §5 §5.1 §8.1 §8.3 (§0 кросс-плей).
- `GrantStarterKit` with `NewPlayer` per §5.1 (fixed templates; equal decks; potions×1; no gear; 1 farm-cat inventory).
- Server-side daily limits 3/5; pass ×2; pity 50/80.
- Validate IAP; grant currency only server-side.
- Jars RNG + pity state persisted.
- Matchmaker: shared pool across mobile/web/desktop; do not filter by platform.
No battle resolution here (call battle-service).
