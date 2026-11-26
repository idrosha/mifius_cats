package sim_test

import (
	"testing"

	"github.com/idrosha/mir_games/battle/internal/content"
	"github.com/idrosha/mir_games/battle/internal/mode"
	"github.com/idrosha/mir_games/battle/internal/sim"
)

// D-058: unused energy on endTurn must not grant MilkDrops / BonusE / BonusDraw.
func TestMilk_UnspentEnergy_NoCarryOrRunaway(t *testing.T) {
	cat, err := content.LoadCatalog(contentRoot(t))
	if err != nil {
		t.Fatal(err)
	}
	b, err := mode.CreatePvE(cat, "milk_unspent", "practice_dummy_1", 42, starters(), nil, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	// Force a fat leftover pool — must simply reset to 0 on endTurn without milk gain.
	b.P1.Energy = 5
	b.P1.MilkDrops = 0
	b.P1.BonusE = 0
	b.P1.BonusDraw = 0
	if err := b.SubmitAction(sim.Action{Kind: sim.ActionEndTurn}); err != nil {
		t.Fatal(err)
	}
	if b.P1.MilkDrops != 0 {
		t.Fatalf("unspent endTurn: want MilkDrops=0, got %d", b.P1.MilkDrops)
	}
	if b.P1.BonusE != 0 || b.P1.BonusDraw != 0 {
		t.Fatalf("unspent endTurn must not grant bonus energy/draw: BonusE=%d BonusDraw=%d", b.P1.BonusE, b.P1.BonusDraw)
	}

	// 8+ empty P1 turns in a row must never inflate Energy (>3) or team hand (>6).
	for i := 0; i < 9; i++ {
		if b.Finished() {
			break
		}
		if err := b.AdvancePvEBots(); err != nil {
			t.Fatal(err)
		}
		if b.Finished() || b.Active != sim.SideP1 {
			break
		}
		if b.P1.Energy > 3 {
			t.Fatalf("turn %d empty-end energy inflation: energy=%d bonusE=%d", b.Turn, b.P1.Energy, b.P1.BonusE)
		}
		if b.P1.BonusE != 0 || b.P1.BonusDraw != 0 {
			t.Fatalf("turn %d empty-end milk burst inflation: bonusE=%d bonusDraw=%d", b.Turn, b.P1.BonusE, b.P1.BonusDraw)
		}
		alive, handTotal := 0, 0
		for _, u := range b.Units {
			if u.Side == sim.SideP1 && u.Alive {
				alive++
				handTotal += len(u.Hand)
			}
		}
		wantHand := sim.DrawPerLiving(alive) * alive
		if handTotal != wantHand {
			t.Fatalf("turn %d empty-end hand inflation: got %d cards for %d living, want %d", b.Turn, handTotal, alive, wantHand)
		}
		if err := b.SubmitAction(sim.Action{Kind: sim.ActionEndTurn}); err != nil {
			t.Fatal(err)
		}
	}
}
