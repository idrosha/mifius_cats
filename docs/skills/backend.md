# Skill: backend

Nakama + economy RPCs. FULL-SPEC §5 §8.1 §8.3 (§0 кросс-плей).
- Server-side daily limits 3/5; pass ×2; pity 50/80.
- Validate IAP; grant currency only server-side.
- Jars RNG + pity state persisted.
- Matchmaker: shared pool across mobile/web/desktop; do not filter by platform.
No battle resolution here (call battle-service).
