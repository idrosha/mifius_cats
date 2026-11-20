package sim

import "sort"

// SelectTargets — FULL-SPEC §3.4 Targeting.
// Formation matters (PvP = PvE, one core): default nearest = frontmost enemy lane,
// then role rank; backline redirects to rear (support first).
// Free-target roles (ranger/mage/support) may pass explicitID for any living enemy.
// taunt/stealth/ambush override.

// freeTargetRole — §3.4: ranger/mage/support may name any living unit via explicitID.
func freeTargetRole(role string) bool {
	switch role {
	case "ranger", "mage", "support":
		return true
	default:
		return false
	}
}

// allowAmbush: card tag `ambush` bypasses stealth (§3.4 / FULL-SPEC).
func (b *Battle) SelectTargets(actor *Unit, rule string, explicitID string, allowAmbush bool) []*Unit {
	var wantExplicit *Unit
	if explicitID != "" {
		if t := b.unitByID(explicitID); t != nil && t.Alive {
			if freeTargetRole(actor.Role) {
				return []*Unit{t}
			}
			// Melee: multi/self/backline cards may name a target; nearest/lowest_hp
			// must match the auto pick (no illegal deep-pick of rear).
			switch rule {
			case "all_enemies", "ally_all", "self":
				// ignore explicit — resolve full set below
			case "backline", "random_enemy", "ally_lowest_hp":
				return []*Unit{t}
			default: // nearest / lowest_hp / ""
				wantExplicit = t
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
		if len(allies) == 0 {
			return nil
		}
		sort.SliceStable(allies, func(i, j int) bool {
			if allies[i].HP != allies[j].HP {
				return allies[i].HP < allies[j].HP
			}
			return allies[i].Lane < allies[j].Lane
		})
		out = []*Unit{allies[0]}
	case "ally_all":
		out = allies
	case "all_enemies":
		out = enemies
	case "lowest_hp":
		cands := filterStealth(enemies, allowAmbush)
		cands = applyTaunt(cands, enemies)
		if len(cands) == 0 {
			return nil
		}
		sort.SliceStable(cands, func(i, j int) bool {
			if cands[i].HP != cands[j].HP {
				return cands[i].HP < cands[j].HP
			}
			return cands[i].Lane < cands[j].Lane
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

	// Melee named a nearest/lowest_hp target that is not the legal auto pick → reject.
	if wantExplicit != nil {
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

func applyTaunt(cands, allEnemies []*Unit) []*Unit {
	var taunters []*Unit
	for _, e := range allEnemies {
		if e.hasStatus("taunt") {
			taunters = append(taunters, e)
		}
	}
	if len(taunters) == 0 {
		return cands
	}
	return taunters
}
