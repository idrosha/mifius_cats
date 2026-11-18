package sim_test

import (
	"path/filepath"
	"runtime"
	"strings"
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
	b, err := mode.CreatePvE(cat, "bot_advance", "test_yard_1", 20261104, team, nil, nil)
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

// D-042: ch2 pitboss must leap the rear even when ally healers want to top up chip damage.
func TestCh2Pitboss_PrefersBacklineOverChipHeal(t *testing.T) {
	cat, err := content.LoadCatalog(contentRoot(t))
	if err != nil {
		t.Fatal(err)
	}
	team := []string{"starter_tank_stone", "starter_fighter_fire", "starter_support_water"}
	b, err := mode.CreatePvE(cat, "ch2_leap", "mythmir_2_f3", 42, team, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	var boss *sim.Unit
	for _, u := range b.Units {
		if u.Side == sim.SideP2 && strings.Contains(u.ID, "pitboss") {
			boss = u
			u.HP = u.MaxHP - 6 // chip (<12) — ch2 healers must not starve pitboss energy
		}
	}
	if boss == nil {
		t.Fatal("missing ch2 pitboss")
	}
	if err := b.SubmitAction(sim.Action{Kind: sim.ActionEndTurn}); err != nil {
		t.Fatal(err)
	}
	a := b.ChooseAction()
	if a.Kind != sim.ActionPlayCard || a.UnitID != boss.ID {
		t.Fatalf("want pitboss leap first, got kind=%s unit=%s", a.Kind, a.UnitID)
	}
	hi := a.HandIndex
	if hi < 0 || hi >= len(boss.Hand) {
		t.Fatalf("bad handIndex %d", hi)
	}
	card := boss.Deck[boss.Hand[hi]]
	if card.TargetRule != "backline" || card.Atk <= 0 {
		t.Fatalf("want backline attack, got rule=%s atk=%d", card.TargetRule, card.Atk)
	}
}

func TestAdvancePvEBots_PvPSmoke_AfterEndTurn_ReturnsToP1(t *testing.T) {
	cat, err := content.LoadCatalog(contentRoot(t))
	if err != nil {
		t.Fatal(err)
	}
	team := []string{"starter_tank_stone", "starter_fighter_fire", "starter_support_water"}
	b, err := mode.CreatePvP(cat, "pvp_bot_advance", "m_smoke", 20261104, team, team, nil, nil)
	if err != nil {
		t.Fatal(err)
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
		t.Fatalf("after PvP smoke advance want P1, got %v", b.Active)
	}
}
