# LiveOps changelog

Одна строка на изменение конфига/схемы (skill `docs/skills/liveops.md`).

- 2026-11-17: tank/support late-finish retune (D-035) — Tank A bash+poke; Tank B pierce↑ + backline cost 1; Support A smite + heal−; Support B finish lowest_hp; art plates unchanged (SoT = content JSON / wiki text)
- v1: initial schemas + defaults §7.4 (energy §3.3, milk/mouse Phase1 §16, limits 3/5, pity 50/80, season 28d, SL feature_flags off, shop offers empty)
- Phase4: CDN stub `cmd/cdn-stub` (:8090) + `soft-launch/geo_allowlist.example.json` (ops ISO, no prod keys)
- 6×2 class variants: roles +assassin; shop common_cat 12 SKU (mage/assassin kits); schema roles min/max 6
- SL test catalogs: shop offers +pass_season / yarn_donate_pack / slot_expand_1 (priced fish packs + grey armor remain HUD stubs)
- 2026-11-11: HP grid retune — tank LVL1 **50** (fighter 43 · assassin 38 · ranger 35 · mage 30 · support 28); gear color sets: armor → flat DEF/HP, weapons → ATK +2…+4 (D-024)
- 2026-11-13: practice_dummy_1 → wiki HP (50/43/28); starter support ATK 3→2 (= shop A); mage ice B HP 28→29 (±5%); HUD baseStats = content, base DEF 0
- 2026-11-13: sheet ATK = catalog (sim hit = card.Atk); skill/500 combo flagged for LiveOps retune under HP50 scale
