package sim

import "sort"

// SelectTargets — FULL-SPEC §3.4 Targeting: nearest → same lane → top on tie; taunt/stealth/ambush override.

func (b *Battle) SelectTargets(actor *Unit, rule string, explicitID string) []*Unit {
	if explicitID != "" {
		if t := b.unitByID(explicitID); t != nil && t.Alive {
			return []*Unit{t}
		}
	}

	allies := b.living(actor.Side)
	enemies := b.living(opposite(actor.Side))

	switch rule {
	case "self":
		return []*Unit{actor}
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
		return []*Unit{allies[0]}
	case "ally_all":
		return allies
	case "all_enemies":
		return enemies
	case "lowest_hp":
		cands := filterStealth(enemies, false)
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
		return []*Unit{cands[0]}
	default: // nearest
		cands := filterStealth(enemies, false)
		cands = applyTaunt(cands, enemies)
		if len(cands) == 0 {
			return nil
		}
		sort.SliceStable(cands, func(i, j int) bool {
			di := abs(cands[i].Lane - actor.Lane)
			dj := abs(cands[j].Lane - actor.Lane)
			if di != dj {
				return di < dj
			}
			if cands[i].Lane != cands[j].Lane {
				return cands[i].Lane < cands[j].Lane // top on tie
			}
			return cands[i].ID < cands[j].ID
		})
		return []*Unit{cands[0]}
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
