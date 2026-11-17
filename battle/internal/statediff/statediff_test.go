package statediff_test

import (
	"path/filepath"
	"runtime"
	"testing"

	"github.com/idrosha/mir_games/battle/internal/content"
	"github.com/idrosha/mir_games/battle/internal/mode"
	"github.com/idrosha/mir_games/battle/internal/sim"
	"github.com/idrosha/mir_games/battle/internal/statediff"
)

func TestFromBattle_CreatePvE_HasBoardAndHand(t *testing.T) {
	cat := loadCatalog(t)
	b, err := mode.CreatePvE(cat, "b_statediff", "test_yard_1", 20261104,
		[]string{"starter_tank_stone", "starter_fighter_fire", "starter_support_water"}, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	d := statediff.FromBattle(b)
	if d.BattleID != "b_statediff" {
		t.Fatalf("battleId=%s", d.BattleID)
	}
	if len(d.Units) != 6 {
		t.Fatalf("units=%d want 6", len(d.Units))
	}
	if len(d.Hand) == 0 {
		t.Fatal("expected non-empty hand for active side")
	}
	if d.Result != "" {
		t.Fatalf("fresh battle result=%q", d.Result)
	}
	if !d.CanEndTurn {
		t.Fatal("fresh P1 turn should CanEndTurn")
	}
}

func TestFromBattle_StunCardsNotPlayable(t *testing.T) {
	cat := loadCatalog(t)
	b, err := mode.CreatePvE(cat, "b_stun", "test_yard_1", 20261104,
		[]string{"starter_tank_stone", "starter_fighter_fire", "starter_support_water"}, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	var u *sim.Unit
	for _, x := range b.Units {
		if x.Side == sim.SideP1 && x.Alive && len(x.Hand) > 0 {
			u = x
			break
		}
	}
	if u == nil {
		t.Fatal("no P1 unit with hand")
	}
	u.Statuses = append(u.Statuses, sim.Status{ID: "stun", Stacks: 1, Duration: 1})
	d := statediff.FromBattle(b)
	for _, c := range d.Hand {
		if c.UnitID == u.ID && c.Playable {
			t.Fatalf("stunned unit card still playable: %+v", c)
		}
	}
}

func TestFromBattle_AutoPlay_P1Win(t *testing.T) {
	cat := loadCatalog(t)
	b, err := mode.CreatePvE(cat, "b_win", "test_yard_1", 20261104,
		[]string{"starter_tank_stone", "starter_fighter_fire", "starter_support_water"}, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	if err := b.AutoPlay(40); err != nil {
		t.Fatal(err)
	}
	d := statediff.FromBattle(b)
	if d.Result != "p1_win" {
		t.Fatalf("result=%s want p1_win", d.Result)
	}
	if d.CanEndTurn {
		t.Fatal("finished battle must not CanEndTurn")
	}
}

func loadCatalog(t *testing.T) *content.Catalog {
	t.Helper()
	_, file, _, _ := runtime.Caller(0)
	root := filepath.Clean(filepath.Join(filepath.Dir(file), "..", "..", "..", "content"))
	cat, err := content.LoadCatalog(root)
	if err != nil {
		t.Fatalf("content: %v (root=%s)", err, root)
	}
	return cat
}
