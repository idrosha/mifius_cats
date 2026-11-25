package sim_test

import (
	"testing"
	"time"

	"github.com/idrosha/mir_games/battle/internal/content"
	"github.com/idrosha/mir_games/battle/internal/mode"
	"github.com/idrosha/mir_games/battle/internal/sim"
)

func TestAdvancePvEBots_SkipsWhenP2Human(t *testing.T) {
	cat, err := content.LoadCatalog(contentRoot(t))
	if err != nil {
		t.Fatal(err)
	}
	team := []string{"starter_tank_stone", "starter_fighter_fire", "starter_support_water"}
	b, err := mode.CreatePvP(cat, "pvp_human", "m_h", 7, team, team, nil, nil, nil, nil, true, 0)
	if err != nil {
		t.Fatal(err)
	}
	if err := b.SubmitAction(sim.Action{Kind: sim.ActionEndTurn}); err != nil {
		t.Fatal(err)
	}
	if b.Active != sim.SideP2 {
		t.Fatalf("want P2 active after P1 endTurn, got %v", b.Active)
	}
	if err := b.AdvancePvEBots(); err != nil {
		t.Fatal(err)
	}
	if b.Active != sim.SideP2 {
		t.Fatalf("P2Human must leave Active=P2, got %v", b.Active)
	}
}

func TestEnforceTurnDeadline_PassesTurn(t *testing.T) {
	cat, err := content.LoadCatalog(contentRoot(t))
	if err != nil {
		t.Fatal(err)
	}
	team := []string{"starter_tank_stone", "starter_fighter_fire", "starter_support_water"}
	b, err := mode.CreatePvP(cat, "pvp_deadline", "m_d", 9, team, team, nil, nil, nil, nil, true, 30)
	if err != nil {
		t.Fatal(err)
	}
	if b.TurnDeadlineUnix <= 0 {
		t.Fatal("expected turn deadline armed")
	}
	b.TurnDeadlineUnix = time.Now().Unix() - 1
	ok, err := b.EnforceTurnDeadline()
	if err != nil {
		t.Fatal(err)
	}
	if !ok {
		t.Fatal("expected timeout endTurn")
	}
	if b.Active != sim.SideP2 {
		t.Fatalf("timeout should pass to P2, got %v", b.Active)
	}
}
