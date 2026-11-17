package battle_test

import (
	"testing"

	"github.com/idrosha/mir_games/battle/internal/content"
	"github.com/idrosha/mir_games/battle/internal/mode"
	"github.com/idrosha/mir_games/battle/internal/sim"
)

// Practice dummies track wiki / D-024 LVL1 HP (tank 50 · fighter 43 · support 28).
func TestPracticeDummyWikiHP(t *testing.T) {
	cat, err := content.LoadCatalog(contentRoot(t))
	if err != nil {
		t.Fatal(err)
	}
	want := map[string]int{
		"bot_practice_tank_a":    50,
		"bot_practice_fighter_a": 43,
		"bot_practice_support_a": 28,
	}
	for _, e := range cat.Stages["practice_dummy_1"].EnemyTeam {
		if e.BaseStats.HP != want[e.TemplateID] {
			t.Fatalf("%s stage hp=%d want %d", e.TemplateID, e.BaseStats.HP, want[e.TemplateID])
		}
	}
	b, err := mode.CreatePvE(cat, "hp", "practice_dummy_1", 1,
		[]string{"starter_tank_stone", "starter_fighter_fire", "starter_support_water"}, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	for _, u := range b.Units {
		if u.Side != sim.SideP2 {
			continue
		}
		matched := false
		for tid, hp := range want {
			if len(u.ID) >= len(tid) && u.ID[len(u.ID)-len(tid):] == tid {
				matched = true
				if u.HP != hp || u.MaxHP != hp {
					t.Fatalf("%s hp=%d/%d want %d", u.ID, u.HP, u.MaxHP, hp)
				}
			}
		}
		if !matched {
			t.Fatalf("unexpected p2 unit %s", u.ID)
		}
	}
}
