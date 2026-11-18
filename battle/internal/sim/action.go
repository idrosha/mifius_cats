package sim

import (
	"fmt"
)

// SubmitAction applies one legal action for the active side. Illegal → error (rejected).
// Clears combat Events (player-facing). AI uses submitActionKeepEvents via AdvancePvEBots.
func (b *Battle) SubmitAction(a Action) error {
	b.clearEvents()
	return b.applyAction(a)
}

func (b *Battle) applyAction(a Action) error {
	if b.Finished() {
		return fmt.Errorf("battle finished: %s", b.Result)
	}

	switch a.Kind {
	case ActionSurrender:
		b.Result = ResultSurrender
		b.record("surrender", &a)
		return nil
	case ActionEndTurn:
		return b.endTurn(&a)
	case ActionPlayCard:
		return b.playCard(a)
	case ActionKeep:
		return b.keepCard(a)
	case ActionPotion:
		return fmt.Errorf("potions not in Phase 1 slice loadout play")
	default:
		return fmt.Errorf("unknown action %s", a.Kind)
	}
}

func (b *Battle) playCard(a Action) error {
	u := b.unitByID(a.UnitID)
	if u == nil || !u.Alive || u.Side != b.Active {
		return fmt.Errorf("illegal unit %s", a.UnitID)
	}
	if u.hasStatus("stun") || u.hasStatus("sleep") {
		return fmt.Errorf("unit %s cannot act (stun/sleep)", a.UnitID)
	}
	if a.HandIndex < 0 || a.HandIndex >= len(u.Hand) {
		return fmt.Errorf("illegal handIndex %d", a.HandIndex)
	}
	cardIdx := u.Hand[a.HandIndex]
	card := u.Deck[cardIdx]
	ps := b.player(b.Active)
	if card.Cost > ps.Energy {
		return fmt.Errorf("not enough energy: need %d have %d", card.Cost, ps.Energy)
	}
	if actorClawBlocksRuffle(u, card.Tags) {
		return fmt.Errorf("claw_mode: no ruffle this turn")
	}

	allowAmbush := hasTag(card.Tags, "ambush")
	targets := b.SelectTargets(u, card.TargetRule, a.TargetID, allowAmbush)
	if needsTarget(card.TargetRule) && len(targets) == 0 {
		return fmt.Errorf("no valid target")
	}

	ps.Energy -= card.Cost
	u.Hand = append(u.Hand[:a.HandIndex], u.Hand[a.HandIndex+1:]...)
	if a.HandIndex < len(u.KeepMask) {
		u.KeepMask = append(u.KeepMask[:a.HandIndex], u.KeepMask[a.HandIndex+1:]...)
	}
	u.Discard = append(u.Discard, cardIdx)
	b.cardsPlayedByUnit[u.ID]++

	b.resolveCard(u, card, targets)
	b.record("playCard", &a)
	b.checkEnd()
	return nil
}

func needsTarget(rule string) bool {
	switch rule {
	case "self", "ally_all":
		return false
	default:
		return true
	}
}

func actorClawBlocksRuffle(u *Unit, tags []string) bool {
	if !u.hasStatus("claw_mode") {
		return false
	}
	for _, t := range tags {
		if t == "ruffle" {
			return true
		}
	}
	return false
}

func (b *Battle) keepCard(a Action) error {
	// Keep §3.4: hold card into next own turn + milk; cost escalates same turn.
	u := b.unitByID(a.UnitID)
	if u == nil || !u.Alive || u.Side != b.Active {
		return fmt.Errorf("illegal unit")
	}
	if a.HandIndex < 0 || a.HandIndex >= len(u.Hand) {
		return fmt.Errorf("illegal handIndex")
	}
	for len(u.KeepMask) < len(u.Hand) {
		u.KeepMask = append(u.KeepMask, false)
	}
	if u.KeepMask[a.HandIndex] {
		return fmt.Errorf("card already kept")
	}
	ps := b.player(b.Active)
	if ps.KeepCost > ps.Energy {
		return fmt.Errorf("not enough energy for keep")
	}
	ps.Energy -= ps.KeepCost
	ps.KeepCost++
	ps.MilkDrops++
	u.KeepMask[a.HandIndex] = true
	b.record("keep", &a)
	b.tryMilkBurst(ps)
	return nil
}

func (b *Battle) tryMilkBurst(ps *PlayerState) {
	// milk_thresholds default 3 (§7.4 / Phase1 §16 default)
	const threshold = 3
	for ps.MilkDrops >= threshold {
		ps.MilkDrops -= threshold
		ps.MilkBursts++
		ps.BonusE++
		if ps.MilkBursts%2 == 0 {
			ps.BonusDraw++
		}
	}
}

func (b *Battle) endTurn(a *Action) error {
	ps := b.player(b.Active)
	if ps.Energy > 0 {
		ps.MilkDrops += ps.Energy
		b.tryMilkBurst(ps)
	}
	ps.Energy = 0

	// §3.3: leftover attack cards → discard immediately at end of turn (Keep stays).
	b.discardUnusedHand(b.Active)
	b.tickStatuses(b.Active)
	b.record("endTurn", a)

	if b.Active == b.First {
		b.beginSideTurn(opposite(b.First), false)
		return nil
	}

	b.roundEnd()
	if b.Finished() {
		return nil
	}
	b.Turn++
	if b.Turn >= 10 {
		b.applyMouseHour()
	}
	b.beginSideTurn(b.First, true)
	return nil
}

func (b *Battle) tickStatuses(side Side) {
	for _, u := range b.living(side) {
		if u.AtkBuffDur > 0 {
			u.AtkBuffDur--
			if u.AtkBuffDur == 0 {
				u.AtkBuff = 0
			}
		}
		kept := u.Statuses[:0]
		for _, s := range u.Statuses {
			switch s.ID {
			case "poison":
				// D-043: permanent stack DoT — tick for stacks, then +1; never expires (cleanse/mint only).
				b.applyHit(nil, u, s.Stacks, false, false, false, false)
				s.Stacks++
				kept = append(kept, s)
				continue
			case "bleed":
				b.applyHit(nil, u, s.Stacks, false, false, false, false)
			}
			if s.Duration > 0 {
				s.Duration--
			}
			if s.ID == "ruffle" && s.Stacks > 0 {
				kept = append(kept, s)
				continue
			}
			if s.Duration > 0 {
				kept = append(kept, s)
			}
		}
		u.Statuses = kept
		if u.hasStatus("claw_mode") {
			filtered := u.Statuses[:0]
			for _, s := range u.Statuses {
				if s.ID != "claw_mode" {
					filtered = append(filtered, s)
				}
			}
			u.Statuses = filtered
		}
	}
	b.checkEnd()
}

func (b *Battle) roundEnd() {
	for _, u := range b.Units {
		if !u.Alive {
			continue
		}
		u.Shield = 0
	}
}

func (b *Battle) applyMouseHour() {
	for _, u := range b.Units {
		if !u.Alive {
			continue
		}
		u.MaxHP--
		if u.MaxHP < 1 {
			u.MaxHP = 1
		}
		if u.HP > u.MaxHP {
			u.HP = u.MaxHP
		}
	}
}
