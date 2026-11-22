package sim

import "sort"

// SelectTargets — FULL-SPEC §3.4 Targeting.
// Formation matters (PvP = PvE, one core): default nearest = frontmost enemy lane,
// then role rank; backline redirects to rear (support first).
// Free-target roles (ranger/mage/support) may pass explicitID for any living enemy.
// taunt/stealth/ambush override.
//
// Taunt (except random_enemy): forces enemy-targeting onto living taunters —
// including free-target explicitID, melee named backline, and all_enemies (AoE
// collapses onto taunters so mass hits cannot splash past a taunting tank).

// freeTargetRole — §3.4: ranger/mage/support may name any living unit via explicitID.
func freeTargetRole(role string) bool {
	switch role {
	case "ranger", "mage", "support":
		return true
	default:
		return false
	}
}

// enemyRuleRespectsTaunt — D-043: only random_enemy ignores taunt (poison spread).
func enemyRuleRespectsTaunt(rule string) bool {
	switch rule {
	case "random_enemy", "self", "ally_lowest_hp", "ally_all":
		return false
	default:
		return true
	}
}

// SelectTargets resolves legal targets for a card.
func (b *Battle) SelectTargets(actor *Unit, rule string, explicitID string, allowAmbush bool) []*Unit {
	var wantExplicit *Unit
	if explicitID != "" {
		if t := b.unitByID(explicitID); t != nil && t.Alive {
			if freeTargetRole(actor.Role) {
				switch rule {
				case "all_enemies", "ally_all", "self":
					// ignore explicit — resolve full set / self below
				case "ally_lowest_hp":
					// Support may name a living ally; wrong side → auto missing-HP pick.
					if t.Side == actor.Side {
						return []*Unit{t}
					}
				case "random_enemy":
					// Named pick allowed; taunt does not redirect (D-043).
					if t.Side != actor.Side {
						return []*Unit{t}
					}
				default:
					// Enemy single-target — remember name; taunt may redirect below.
					if t.Side != actor.Side {
						wantExplicit = t
					}
				}
			} else {
				// Melee: multi/self/backline cards may name a target; nearest/lowest_hp
				// must match the auto pick (no illegal deep-pick of rear).
				switch rule {
				case "all_enemies", "ally_all", "self":
					// ignore explicit — resolve full set below
				case "ally_lowest_hp":
					if t.Side == actor.Side {
						return []*Unit{t}
					}
					// wrong side → auto missing-HP pick
				case "random_enemy":
					if t.Side != actor.Side {
						return []*Unit{t}
					}
				case "backline":
					// Named backline still subject to taunt (no early bypass).
					if t.Side != actor.Side {
						wantExplicit = t
					}
				default: // nearest / lowest_hp / center / ""
					wantExplicit = t
				}
			}
		}
	}

	allies := b.living(actor.Side)
	enemies := b.living(opposite(actor.Side))

	var out []*Unit
	switch rule {
	case "self":
		out = []*Unit{actor}
	case "ally_lowest_hp":
		// Most wounded ally by missing HP (MaxHP−HP), not absolute HP —
		// otherwise a full-HP support with small MaxHP always wins.
		if len(allies) == 0 {
			return nil
		}
		sort.SliceStable(allies, func(i, j int) bool {
			mi := allies[i].MaxHP - allies[i].HP
			mj := allies[j].MaxHP - allies[j].HP
			if mi != mj {
				return mi > mj
			}
			if allies[i].Lane != allies[j].Lane {
				return allies[i].Lane < allies[j].Lane
			}
			return allies[i].ID < allies[j].ID
		})
		out = []*Unit{allies[0]}
	case "ally_all":
		out = allies
	case "all_enemies":
		out = enemies
		out = applyTaunt(out, enemies)
	case "lowest_hp":
		// Enemy hunter mark: absolute current HP (wiki / D-035 «наименьшим HP»).
		// Distinct from ally_lowest_hp (missing). Taunt/stealth/ambush still apply.
		cands := filterStealth(enemies, allowAmbush)
		cands = applyTaunt(cands, enemies)
		if len(cands) == 0 {
			return nil
		}
		sort.SliceStable(cands, func(i, j int) bool {
			if cands[i].HP != cands[j].HP {
				return cands[i].HP < cands[j].HP
			}
			if cands[i].Lane != cands[j].Lane {
				return cands[i].Lane < cands[j].Lane
			}
			return cands[i].ID < cands[j].ID
		})
		out = []*Unit{cands[0]}
	case "backline":
		cands := filterStealth(enemies, allowAmbush)
		cands = applyTaunt(cands, enemies)
		if len(cands) == 0 {
			return nil
		}
		sort.SliceStable(cands, func(i, j int) bool {
			ri := roleFrontRank(cands[i].Role)
			rj := roleFrontRank(cands[j].Role)
			if ri != rj {
				return ri > rj // support/rear first
			}
			if cands[i].Lane != cands[j].Lane {
				return cands[i].Lane > cands[j].Lane // deeper back
			}
			di := abs(cands[i].Lane - actor.Lane)
			dj := abs(cands[j].Lane - actor.Lane)
			if di != dj {
				return di < dj
			}
			return cands[i].ID < cands[j].ID
		})
		out = []*Unit{cands[0]}
	case "random_enemy":
		// D-043: seeded pick among living (stealth-filtered). Taunt does not redirect — poison spread.
		cands := filterStealth(enemies, allowAmbush)
		if len(cands) == 0 {
			return nil
		}
		sort.SliceStable(cands, func(i, j int) bool {
			return cands[i].ID < cands[j].ID
		})
		if b.rng == nil {
			out = []*Unit{cands[0]}
		} else {
			out = []*Unit{cands[b.rng.Intn(len(cands))]}
		}
	case "center":
		// Prefer mid lane (1), then nearest living; taunt still redirects.
		cands := filterStealth(enemies, allowAmbush)
		cands = applyTaunt(cands, enemies)
		if len(cands) == 0 {
			return nil
		}
		sort.SliceStable(cands, func(i, j int) bool {
			di := abs(cands[i].Lane - 1)
			dj := abs(cands[j].Lane - 1)
			if di != dj {
				return di < dj
			}
			if cands[i].Lane != cands[j].Lane {
				return cands[i].Lane < cands[j].Lane
			}
			return cands[i].ID < cands[j].ID
		})
		out = []*Unit{cands[0]}
	default: // nearest — frontmost lane, then role rank (§3.4)
		cands := filterStealth(enemies, allowAmbush)
		cands = applyTaunt(cands, enemies)
		if len(cands) == 0 {
			return nil
		}
		sort.SliceStable(cands, func(i, j int) bool {
			if cands[i].Lane != cands[j].Lane {
				return cands[i].Lane < cands[j].Lane // frontmost enemy first
			}
			ri := roleFrontRank(cands[i].Role)
			rj := roleFrontRank(cands[j].Role)
			if ri != rj {
				return ri < rj
			}
			di := abs(cands[i].Lane - actor.Lane)
			dj := abs(cands[j].Lane - actor.Lane)
			if di != dj {
				return di < dj
			}
			return cands[i].ID < cands[j].ID
		})
		out = []*Unit{cands[0]}
	}

	// Free-target / named backline: prefer explicit when still legal under taunt.
	if wantExplicit != nil && enemyRuleRespectsTaunt(rule) && rule != "all_enemies" {
		taunters := livingTaunters(enemies)
		if len(taunters) == 0 {
			// No taunt — free-target may keep named enemy; melee nearest still validated below.
			if freeTargetRole(actor.Role) || rule == "backline" {
				return []*Unit{wantExplicit}
			}
		} else {
			for _, tn := range taunters {
				if tn.ID == wantExplicit.ID {
					return []*Unit{wantExplicit}
				}
			}
			// Named non-taunter while taunt is up → forced onto auto taunt pick.
			return out
		}
	}

	// Melee named a nearest/lowest_hp/center target that is not the legal auto pick → reject.
	if wantExplicit != nil && !freeTargetRole(actor.Role) && rule != "backline" {
		if len(out) != 1 || out[0].ID != wantExplicit.ID {
			return nil
		}
	}
	return out
}

// roleFrontRank — §3.4: tank → fighter → assassin → mage → ranger → support.
func roleFrontRank(role string) int {
	switch role {
	case "tank":
		return 0
	case "fighter":
		return 1
	case "assassin":
		return 2
	case "mage":
		return 3
	case "ranger":
		return 4
	case "support":
		return 5
	default:
		return 6
	}
}

func opposite(s Side) Side {
	if s == SideP1 {
		return SideP2
	}
	return SideP1
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

func filterStealth(enemies []*Unit, allowAmbush bool) []*Unit {
	var out []*Unit
	for _, e := range enemies {
		if e.hasStatus("stealth") && !allowAmbush {
			continue
		}
		out = append(out, e)
	}
	if len(out) == 0 {
		return enemies // if all stealthed, fall back
	}
	return out
}

func livingTaunters(allEnemies []*Unit) []*Unit {
	var taunters []*Unit
	for _, e := range allEnemies {
		if e.hasStatus("taunt") {
			taunters = append(taunters, e)
		}
	}
	return taunters
}

func applyTaunt(cands, allEnemies []*Unit) []*Unit {
	taunters := livingTaunters(allEnemies)
	if len(taunters) == 0 {
		return cands
	}
	return taunters
}
