# Skill: battle

Server = truth. Implement sequential 3v3 per FULL-SPEC §3.
- EffectOps DSL data-driven; no per-card hardcoded switches if avoidable.
- Deterministic: seed + inputs → replay.
- Reject illegal plays.
- Roles/elements mods: §2.1–2.2 only (6 roles incl. `assassin`).
- **Formation/targeting (§2.1, §3.4):** one sim core for PvP+PvE.
  - Default `nearest` = frontmost enemy lane, then role rank tank→fighter→assassin→mage→ranger→support.
  - Front melee (lane0 tank/fighter/assassin): single nearest front; AoE only reaches more.
  - Mid/back melee: default nearest; farther via `backline` / `ranged`.
  - Ranger/mage/support: free-target (any rule + explicitID).
  - `backline` = rear role priority (support first); wire via `targetRule`, not hardcoded card IDs.
  - Tags: `crit` ×1.5 dmg; `pierce`/fragile ignore shield; freeze=`stun`.
  - Lane 0..2 = front→back; taunt/stealth/ambush overrides unchanged.
Do not implement Unity UI or shop.
