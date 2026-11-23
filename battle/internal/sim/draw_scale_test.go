package sim_test

import (
	"testing"

	"github.com/idrosha/mir_games/battle/internal/content"
	"github.com/idrosha/mir_games/battle/internal/mode"
	"github.com/idrosha/mir_games/battle/internal/sim"
)

func TestDrawPerLivingTable(t *testing.T) {
	cases := []struct {
		alive int
		want  int
	}{
		{3, 2},
		{2, 3},
		{1, 4},
		{0, 0},
		{4, 2},
	}
	for _, c := range cases {
		if got := sim.DrawPerLiving(c.alive); got != c.want {
			t.Fatalf("alive=%d draw=%d want %d", c.alive, got, c.want)
		}
	}
}

func TestDrawScalesAfterAllyDeaths(t *testing.T) {
	cat, err := content.LoadCatalog(contentRoot(t))
	if err != nil {
		t.Fatal(err)
	}
	// Same sim core for practice / PvE / PvP (§3); PvE setup is enough to verify D*.
	b, err := mode.CreatePvE(cat, "draw_scale", "test_yard_1", 42, starters(), nil, nil, nil)
	if err != nil {
		t.Fatal(err)
	}

	p1 := make([]*sim.Unit, 0, 3)
	for _, u := range b.Units {
		if u.Side == sim.SideP1 {
			p1 = append(p1, u)
		}
	}
	if len(p1) != 3 {
		t.Fatalf("want 3 p1 units, got %d", len(p1))
	}
	for _, u := range p1 {
		if len(u.Hand) != 2 {
			t.Fatalf("%s opening hand=%d want D2", u.ID, len(u.Hand))
		}
	}

	// Kill one ally → next own turn each living draws D3.
	p1[0].HP = 0
	p1[0].Alive = false
	p1[0].Hand = nil
	p1[0].KeepMask = nil
	if err := b.SubmitAction(sim.Action{Kind: sim.ActionEndTurn}); err != nil {
		t.Fatal(err)
	}
	if err := b.SubmitAction(sim.Action{Kind: sim.ActionEndTurn}); err != nil {
		t.Fatal(err)
	}
	if b.Active != sim.SideP1 {
		t.Fatalf("want P1, got %v", b.Active)
	}
	team := 0
	for _, u := range p1 {
		if !u.Alive {
			continue
		}
		if len(u.Hand) != 3 {
			t.Fatalf("%s after 1 death hand=%d want D3", u.ID, len(u.Hand))
		}
		team += len(u.Hand)
	}
	if team != 6 {
		t.Fatalf("team hand after 1 death=%d want 6", team)
	}

	// Kill second ally → sole survivor draws D4.
	p1[1].HP = 0
	p1[1].Alive = false
	p1[1].Hand = nil
	p1[1].KeepMask = nil
	if err := b.SubmitAction(sim.Action{Kind: sim.ActionEndTurn}); err != nil {
		t.Fatal(err)
	}
	if err := b.SubmitAction(sim.Action{Kind: sim.ActionEndTurn}); err != nil {
		t.Fatal(err)
	}
	if b.Active != sim.SideP1 {
		t.Fatalf("want P1, got %v", b.Active)
	}
	alive := 0
	for _, u := range p1 {
		if !u.Alive {
			continue
		}
		alive++
		if len(u.Hand) != 4 {
			t.Fatalf("%s last cat hand=%d want D4", u.ID, len(u.Hand))
		}
	}
	if alive != 1 {
		t.Fatalf("want 1 alive, got %d", alive)
	}
}
