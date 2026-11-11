package sim_test

import (
	"testing"

	"github.com/idrosha/mir_games/battle/internal/content"
	"github.com/idrosha/mir_games/battle/internal/mode"
	"github.com/idrosha/mir_games/battle/internal/sim"
)

func starters() []string {
	return []string{"starter_tank_stone", "starter_fighter_fire", "starter_support_water"}
}

func p1Unit(b *sim.Battle) *sim.Unit {
	for _, u := range b.Units {
		if u.Side == sim.SideP1 && u.Alive {
			return u
		}
	}
	return nil
}

func cardSet(idxs []int) map[int]int {
	m := map[int]int{}
	for _, i := range idxs {
		m[i]++
	}
	return m
}

func TestDeckCycle_EndTurnDiscardsUnused_ThenReshuffles(t *testing.T) {
	cat, err := content.LoadCatalog(contentRoot(t))
	if err != nil {
		t.Fatal(err)
	}
	for _, modeName := range []string{"pve", "pvp"} {
		t.Run(modeName, func(t *testing.T) {
			var b *sim.Battle
			var err error
			if modeName == "pve" {
				b, err = mode.CreatePvE(cat, "cycle_pve", "test_yard_1", 77, starters(), nil)
			} else {
				b, err = mode.CreatePvP(cat, "cycle_pvp", "m1", 77, starters(), starters(), nil, nil)
			}
			if err != nil {
				t.Fatal(err)
			}
			u := p1Unit(b)
			if u == nil {
				t.Fatal("no p1 unit")
			}
			if len(u.Hand) == 0 {
				t.Fatal("expected opening hand")
			}
			handBefore := append([]int(nil), u.Hand...)
			if err := b.SubmitAction(sim.Action{Kind: sim.ActionEndTurn}); err != nil {
				t.Fatal(err)
			}
			// After P1 endTurn: unused cards must already be in discard, hand empty (no Keep).
			if len(u.Hand) != 0 {
				t.Fatalf("unused hand should discard at endTurn, got hand=%v", u.Hand)
			}
			gotDiscard := cardSet(u.Discard)
			wantDiscard := cardSet(handBefore)
			if len(gotDiscard) != len(wantDiscard) {
				t.Fatalf("discard size: got %v want %v (hand was %v)", gotDiscard, wantDiscard, handBefore)
			}
			for k, v := range wantDiscard {
				if gotDiscard[k] != v {
					t.Fatalf("discard missing card %d: got %v want %v", k, gotDiscard, wantDiscard)
				}
			}

			// Finish P2 turn so P1 begins turn 2 and draws (reshuffle from discard).
			if b.Active != sim.SideP2 {
				t.Fatalf("active=%v want P2", b.Active)
			}
			if err := b.SubmitAction(sim.Action{Kind: sim.ActionEndTurn}); err != nil {
				t.Fatal(err)
			}
			if b.Active != sim.SideP1 || b.Turn != 2 {
				t.Fatalf("want P1 turn 2, got active=%v turn=%d", b.Active, b.Turn)
			}
			if len(u.Hand) == 0 {
				t.Fatal("expected redraw after reshuffle cycle")
			}
			// All cards accounted for across zones.
			total := len(u.Hand) + len(u.DrawPile) + len(u.Discard)
			if total != len(u.Deck) {
				t.Fatalf("card conservation: hand+draw+discard=%d deck=%d", total, len(u.Deck))
			}
		})
	}
}

func TestDeckCycle_KeepCarriesIntoNextOwnTurn(t *testing.T) {
	cat, err := content.LoadCatalog(contentRoot(t))
	if err != nil {
		t.Fatal(err)
	}
	b, err := mode.CreatePvE(cat, "keep_cycle", "test_yard_1", 99, starters(), nil)
	if err != nil {
		t.Fatal(err)
	}
	u := p1Unit(b)
	if u == nil || len(u.Hand) == 0 {
		t.Fatal("need p1 hand")
	}
	keptIdx := u.Hand[0]
	if err := b.SubmitAction(sim.Action{Kind: sim.ActionKeep, UnitID: u.ID, HandIndex: 0}); err != nil {
		t.Fatal(err)
	}
	if err := b.SubmitAction(sim.Action{Kind: sim.ActionEndTurn}); err != nil {
		t.Fatal(err)
	}
	if len(u.Hand) != 1 || u.Hand[0] != keptIdx {
		t.Fatalf("kept card should remain after endTurn, hand=%v want [%d]", u.Hand, keptIdx)
	}
	if err := b.SubmitAction(sim.Action{Kind: sim.ActionEndTurn}); err != nil {
		t.Fatal(err)
	}
	// P1 turn 2: kept card still present, plus new draws.
	found := false
	for _, hi := range u.Hand {
		if hi == keptIdx {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("kept card %d missing from new hand %v", keptIdx, u.Hand)
	}
	if len(u.Hand) < 2 {
		t.Fatalf("expected kept + draws, hand=%v", u.Hand)
	}
}

func TestDeckCycle_PlayedCardGoesToDiscard(t *testing.T) {
	cat, err := content.LoadCatalog(contentRoot(t))
	if err != nil {
		t.Fatal(err)
	}
	b, err := mode.CreatePvP(cat, "play_disc", "m2", 3, starters(), starters(), nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	var u *sim.Unit
	var handIdx int
	var cardIdx int
	for _, cand := range b.Units {
		if cand.Side != sim.SideP1 || !cand.Alive {
			continue
		}
		for hi, ci := range cand.Hand {
			if cand.Deck[ci].Cost <= b.P1.Energy {
				u = cand
				handIdx = hi
				cardIdx = ci
				break
			}
		}
		if u != nil {
			break
		}
	}
	if u == nil {
		t.Fatal("no affordable card on P1")
	}
	if err := b.SubmitAction(sim.Action{Kind: sim.ActionPlayCard, UnitID: u.ID, HandIndex: handIdx, TargetID: ""}); err != nil {
		t.Fatal(err)
	}
	found := false
	for _, d := range u.Discard {
		if d == cardIdx {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("played card %d not in discard %v", cardIdx, u.Discard)
	}
}
