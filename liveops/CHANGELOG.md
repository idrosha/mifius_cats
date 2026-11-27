# LiveOps changelog

Одна строка на изменение конфига/схемы (skill `docs/skills/liveops.md`).

- 2026-11-27: MVP Beta flag & config (`D-066`/`D-067`) — `feature_flags.mvp_beta=true`, pass limits 4 PvE / 10 PvP (`pve_per_day_pass_mvp=4`, `pvp_per_day_pass_mvp=10`), `pass_cat_xp_multiplier=2`, `ads_enabled=false`, `shop_gacha_enabled=false`, `replays_max=10`, `daily_quests` (3/day), `season.prizes` + soft MMR decay
- 2026-11-25: Mythmir clear-band (D-060) — ch1 Baron HP 110; ch3 f2 / scarlet short_2 assassin ATK↓ HP↓ + tank shields↓; ch5 f1/f2 ghost HP/ATK/heal↓ so starter AutoPlay clears; golden yard turn 6/36
- 2026-11-26: Unspent energy on `endTurn` no longer grants milk drops (`0`, was `+1`); eliminates 5/5 AP and 9-card hand buildup on skipped turns (`D-058` / §3.3–3.4; sim `action.go`)
- 2026-11-25: Milk unspent energy — leftover AP on `endTurn` → **+1** milk drop (not +E); stops empty-end BonusE runaway (`D-058` / §3.4; sim `action.go`, threshold config unchanged)
- 2026-11-23: Turn timer by mode — PvE/PvP 30s fixed; other modes 60s (`battle_turn_sec` raise floor for non-PvE/PvP)
- 2026-11-22: Battle turn timer — `limits.battle_turn_sec=60` (1 min · docs/raids/COMPOSITION.md)
- 2026-11-22: Raid/legion limits — `raid_attempts_weekly=3`, `raid_weekly_lock=true`, `raid_soft_wipe_cap=5` (docs/raids · qa/RAID_ACCEPTANCE G7)
- 2026-11-22: Mythmir chess rebalance — ch2 pitboss Лютый Клык backline leaps 6–7 HP 54; ch5 Фантом Гул backline slash 7 + cleave 6 HP 58; ch4 Некропёс HP 48 miasma 3; ch2 f1 soldiers buffed; pitboss cards respect taunt via `backline` rule (`mythmir_*`)

- 2026-11-18: Mythmir ch5 f3 — Фантом Гул HP 95 + backline slashes 10/12 + cleave 9 (D-042 / `mythmir_5_f3`)
- 2026-11-18: Mythmir soldiers retune #2 — much higher HP + tank shields; ch3–4 card ATK up (punish no-heal). Clear-all CI = per-wave full starters (D-042)
- 2026-11-18: Mythmir soldier damage up across ch1–5 f1/f2 (+ card ATK / HP); f3 flanks light bump; ch1 baron pierce −1 & HP 110 so clear-all holds (D-042)
- 2026-11-18: Poison permanent escalate +1/tick; `random_enemy` targeting (D-043 / §3.4–3.5); ch4 f3 assassins+necro rear hunt — `mythmir_4_f3`
- 2026-11-18: Mythmir ch2 f3 — Лютый Клык stronger + `backline` leaps to rear (D-042 / §4.1); stage `mythmir_2_f3`
- 2026-11-18: Mythmir f3 pitboss tactics — chapter layouts + balance in `content/stages/mythmir_{1..5}_f3` (D-042 / §4.1); solo pierce boss, healer packs, tank walls, necro+poison, slash mid
- 2026-11-17: Mythmir PvE fatigue stub — `limits.pve_fatigue_sec=420`, `pve_fatigue_stub=true` (D-039 / §4.1); chapter enemy balance in `content/stages/mythmir_*`
- 2026-11-18: HUD attack-card live overlay removed (D-038 Rejected); plate text stays baked — retake list `docs/stitch-prompts-d035-tank-support-retune.md`
- 2026-11-17: HUD attack-card title/effect = live overlay from `data/card-effects.json` (D-038); regen via `scripts/gen-card-effects.py`
- 2026-11-17: tank/support late-finish retune (D-035) — Tank A bash+poke; Tank B pierce↑ + backline cost 1; Support A smite + heal−; Support B finish lowest_hp; art plates unchanged (SoT = content JSON / wiki text)
- v1: initial schemas + defaults §7.4 (energy §3.3, milk/mouse Phase1 §16, limits 3/5, pity 50/80, season 28d, SL feature_flags off, shop offers empty)
- Phase4: CDN stub `cmd/cdn-stub` (:8090) + `soft-launch/geo_allowlist.example.json` (ops ISO, no prod keys)
- 6×2 class variants: roles +assassin; shop common_cat 12 SKU (mage/assassin kits); schema roles min/max 6
- SL test catalogs: shop offers +pass_season / yarn_donate_pack / slot_expand_1 (priced fish packs + grey armor remain HUD stubs)
- 2026-11-11: HP grid retune — tank LVL1 **50** (fighter 43 · assassin 38 · ranger 35 · mage 30 · support 28); gear color sets: armor → flat DEF/HP, weapons → ATK +2…+4 (D-024)
- 2026-11-13: practice_dummy_1 → wiki HP (50/43/28); starter support ATK 3→2 (= shop A); mage ice B HP 28→29 (±5%); HUD baseStats = content, base DEF 0
- 2026-11-13: sheet ATK = catalog (sim hit = card.Atk); skill/500 combo flagged for LiveOps retune under HP50 scale
