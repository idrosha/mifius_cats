package sim_test

import (
	"path/filepath"
	"runtime"
	"testing"

	"github.com/idrosha/mir_games/battle/internal/content"
	"github.com/idrosha/mir_games/battle/internal/mode"
	"github.com/idrosha/mir_games/battle/internal/sim"
)

func contentRoot(t *testing.T) string {
	t.Helper()
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("runtime.Caller")
	}
	// battle/internal/sim → repo content/
	return filepath.Clean(filepath.Join(filepath.Dir(file), "..", "..", "..", "content"))
}

func TestAdvancePvEBots_AfterEndTurn_ReturnsToP1(t *testing.T) {
	cat, err := content.LoadCatalog(contentRoot(t))
	if err != nil {
		t.Fatal(err)
	}
	team := []string{"starter_tank_stone", "starter_fighter_fire", "starter_support_water"}
	b, err := mode.CreatePvE(cat, "bot_advance", "test_yard_1", 20261104, team, nil)
	if err != nil {
		t.Fatal(err)
	}
	if b.Active != sim.SideP1 {
		t.Fatalf("want P1 start, got %v", b.Active)
	}
	if err := b.SubmitAction(sim.Action{Kind: sim.ActionEndTurn}); err != nil {
		t.Fatal(err)
	}
	if err := b.AdvancePvEBots(); err != nil {
		t.Fatal(err)
	}
	if b.Finished() {
		return
	}
	if b.Active != sim.SideP1 {
		t.Fatalf("after bot advance want P1, got %v", b.Active)
	}
}
