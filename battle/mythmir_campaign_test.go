package battle_test

import (
	"fmt"
	"strings"
	"testing"

	"github.com/idrosha/mir_games/battle/internal/content"
	"github.com/idrosha/mir_games/battle/internal/mode"
	"github.com/idrosha/mir_games/battle/internal/sim"
)

var startersTeam = []string{"starter_tank_stone", "starter_fighter_fire", "starter_support_water"}

var wantFaction = map[int]string{
	1: "dogs",
	2: "wolves",
	3: "red_dogs",
	4: "zombies",
	5: "ghosts",
}

func mythmirCatalog(t *testing.T) *content.Catalog {
	t.Helper()
	cat, err := content.LoadCatalog(contentRoot(t))
	if err != nil {
		t.Fatal(err)
	}
	return cat
}

var wantPrefix = map[int]string{
	1: "dog",
	2: "wolf",
	3: "redd",
	4: "zomb",
	5: "ghost",
}

// TestMythmirStages_Layout — no combat: chapters, locations, soldiers/boss placement (MF-163 §9).
func TestMythmirStages_Layout(t *testing.T) {
	cat := mythmirCatalog(t)
	for ch := 1; ch <= 5; ch++ {
		pfx := wantPrefix[ch]
		for f := 1; f <= 3; f++ {
			id := fmt.Sprintf("mythmir_%d_f%d", ch, f)
			st, ok := cat.Stages[id]
			if !ok {
				t.Fatalf("missing stage %s", id)
			}
			if st.Chapter != ch {
				t.Fatalf("%s chapter=%d want %d", id, st.Chapter, ch)
			}
			if len(st.EnemyTeam) != 3 {
				t.Fatalf("%s enemies=%d", id, len(st.EnemyTeam))
			}
			for i, e := range st.EnemyTeam {
				if len(e.Deck) < 4 || len(e.Deck) > 6 {
					t.Fatalf("%s lane%d deck=%d", id, i, len(e.Deck))
				}
				if e.BaseStats.HP < 8 {
					t.Fatalf("%s lane%d hp too low: %d", id, i, e.BaseStats.HP)
				}
				tid := e.TemplateID
				if f == 3 && i == 1 {
					if !containsAll(tid, "pitboss", pfx) {
						t.Fatalf("%s pitboss template=%s want pitboss+%s", id, tid, pfx)
					}
				} else if !containsAll(tid, "bot_", pfx) {
					t.Fatalf("%s lane%d template=%s want bot_+%s (faction=%s)", id, i, tid, pfx, wantFaction[ch])
				}
			}
			if f == 3 {
				// Pitboss sits center (lane 1), fighter role, highest HP on the row.
				boss := st.EnemyTeam[1]
				if boss.Role != "fighter" {
					t.Fatalf("%s pitboss role=%s", id, boss.Role)
				}
				if boss.BaseStats.HP <= st.EnemyTeam[0].BaseStats.HP {
					t.Fatalf("%s pitboss hp %d not > tank %d", id, boss.BaseStats.HP, st.EnemyTeam[0].BaseStats.HP)
				}
			} else {
				// Soldiers waves: tank / fighter / support — no pitboss id.
				for _, e := range st.EnemyTeam {
					if containsAll(e.TemplateID, "pitboss") {
						t.Fatalf("%s unexpected pitboss on soldiers wave: %s", id, e.TemplateID)
					}
				}
			}
		}
	}
}

func containsAll(s string, parts ...string) bool {
	for _, p := range parts {
		if p != "" && !strings.Contains(s, p) {
			return false
		}
	}
	return true
}

// TestMythmir_CarryAlive_NoRevive — dead lane stays dead; living at MaxHP (D-039).
func TestMythmir_CarryAlive_NoRevive(t *testing.T) {
	cat := mythmirCatalog(t)
	carry := []bool{true, false, true} // fighter dead after wave 1
	b, err := mode.CreatePvE(cat, "carry", "mythmir_1_f2", 42, startersTeam, nil, carry)
	if err != nil {
		t.Fatal(err)
	}
	var p1 []*sim.Unit
	for _, u := range b.Units {
		if u.Side == sim.SideP1 {
			p1 = append(p1, u)
		}
	}
	if len(p1) != 3 {
		t.Fatalf("p1=%d", len(p1))
	}
	if !p1[0].Alive || p1[0].HP != p1[0].MaxHP {
		t.Fatalf("tank want full alive hp=%d/%d", p1[0].HP, p1[0].MaxHP)
	}
	if p1[1].Alive || p1[1].HP != 0 {
		t.Fatalf("fighter should stay dead, alive=%v hp=%d", p1[1].Alive, p1[1].HP)
	}
	if !p1[2].Alive || p1[2].HP != p1[2].MaxHP {
		t.Fatalf("support want full alive")
	}
}

// TestMythmir_StartersClearAllChapters — support·DPS·tank (sim lanes tank·fighter·support) clear 5×3.
func TestMythmir_StartersClearAllChapters(t *testing.T) {
	cat := mythmirCatalog(t)
	for ch := 1; ch <= 5; ch++ {
		carry := []bool{true, true, true}
		for f := 1; f <= 3; f++ {
			id := fmt.Sprintf("mythmir_%d_f%d", ch, f)
			b, err := mode.CreatePvE(cat, "clear_"+id, id, int64(20261117+ch*10+f), startersTeam, nil, carry)
			if err != nil {
				t.Fatalf("%s create: %v", id, err)
			}
			if err := b.AutoPlay(80); err != nil {
				t.Fatalf("%s auto: %v", id, err)
			}
			if b.Result != sim.ResultP1Win {
				t.Fatalf("%s result=%s turn=%d want p1_win (faction=%s)", id, b.Result, b.Turn, wantFaction[ch])
			}
			// Carry death into next level of the same chapter; living restored next CreatePvE.
			next := make([]bool, 3)
			i := 0
			for _, u := range b.Units {
				if u.Side != sim.SideP1 {
					continue
				}
				next[i] = u.Alive
				i++
			}
			carry = next
			if f < 3 {
				alive := 0
				for _, a := range carry {
					if a {
						alive++
					}
				}
				if alive == 0 {
					t.Fatalf("%s wiped before boss — balance too hard", id)
				}
			}
		}
	}
}
