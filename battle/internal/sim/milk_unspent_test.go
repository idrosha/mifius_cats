package sim_test

import (
	"testing"

	"github.com/idrosha/mir_games/battle/internal/content"
	"github.com/idrosha/mir_games/battle/internal/mode"
	"github.com/idrosha/mir_games/battle/internal/sim"
)

// D-058: leftover energy on endTurn → exactly +1 milk drop, not +Energy.
func TestMilk_UnspentEnergy_OneDropNotPerPoint(t *testing.T) {
	cat, err := content.LoadCatalog(contentRoot(t))
	if err != nil {
		t.Fatal(err)
	}
	b, err := mode.CreatePvE(cat, "milk_unspent", "practice_dummy_1", 42, starters(), nil, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	// Force a fat leftover pool — old bug converted all 5 into milk (near-instant burst).
	b.P1.Energy = 5
	b.P1.MilkDrops = 0
	b.P1.BonusE = 0
	if err := b.SubmitAction(sim.Action{Kind: sim.ActionEndTurn}); err != nil {
		t.Fatal(err)
	}
	if b.P1.MilkDrops != 1 {
		t.Fatalf("unspent endTurn: want MilkDrops=1, got %d (must not += Energy)", b.P1.MilkDrops)
	}
	if b.P1.BonusE != 0 {
		t.Fatalf("5 leftover AP must not trigger a burst on its own, BonusE=%d", b.P1.BonusE)
	}

	// Several empty P1 turns must not recreate 8/8 AP runaway from the report.
	for i := 0; i < 5; i++ {
		if b.Finished() {
			break
		}
		if err := b.AdvancePvEBots(); err != nil {
			t.Fatal(err)
		}
		if b.Finished() || b.Active != sim.SideP1 {
			break
		}
		if err := b.SubmitAction(sim.Action{Kind: sim.ActionEndTurn}); err != nil {
			t.Fatal(err)
		}
	}
	_ = b.AdvancePvEBots()
	if b.P1.Energy >= 8 {
		t.Fatalf("empty-end runaway: energy=%d bonusE=%d", b.P1.Energy, b.P1.BonusE)
	}
	if b.P1.BonusE > 2 {
		t.Fatalf("after ~6 empty ends BonusE=%d want ≤2 (1 drop/end, threshold 3)", b.P1.BonusE)
	}
}
