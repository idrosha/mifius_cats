# Skill: battle

Server = truth. Implement sequential 3v3 per FULL-SPEC §3.
- EffectOps DSL data-driven; no per-card hardcoded switches if avoidable.
- Deterministic: seed + inputs → replay.
- Reject illegal plays.
- Roles/elements mods: §2.1–2.2 only.
- **Formation/targeting (§2.1, §3.4):** one sim core for PvP+PvE.
  - Default `nearest` = front role priority tank→fighter→mage→ranger→support.
  - `backline` = rear role priority (support first); wire via `targetRule`, not hardcoded card IDs.
  - Lane 0..2 = front→back; taunt/stealth/ambush overrides unchanged.
Do not implement Unity UI or shop.
