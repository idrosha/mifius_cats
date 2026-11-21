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

// D-042 / D-051 f3 layouts: pitboss lane per chapter (0=front → 2=back).
var wantBossLane = map[int]int{
	1: 0, // solo front
	2: 1, // heal · boss · heal
	3: 1, // tank · boss · tank
	4: 1, // assassin · necro · assassin
	5: 1, // tank · boss · heal
}

// TestMythmirStages_Layout — no combat: chapters, locations, soldiers/boss placement (MF-163 / D-042).
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
				if strings.Contains(e.TemplateID, "empty_lane") {
					continue
				}
				if e.BaseStats.HP < 8 {
					t.Fatalf("%s lane%d hp too low: %d", id, i, e.BaseStats.HP)
				}
			}
			if f == 3 {
				bossLane := -1
				for i, e := range st.EnemyTeam {
					if strings.Contains(e.TemplateID, "pitboss") {
						bossLane = i
						if !containsAll(e.TemplateID, "pitboss", pfx) {
							t.Fatalf("%s pitboss template=%s want pitboss+%s", id, e.TemplateID, pfx)
						}
					} else if !strings.Contains(e.TemplateID, "empty_lane") && !containsAll(e.TemplateID, "bot_", pfx) {
						t.Fatalf("%s lane%d template=%s want bot_+%s", id, i, e.TemplateID, pfx)
					}
				}
				if bossLane < 0 {
					t.Fatalf("%s no pitboss", id)
				}
				if bossLane != wantBossLane[ch] {
					t.Fatalf("%s pitboss lane=%d want %d", id, bossLane, wantBossLane[ch])
				}
				boss := st.EnemyTeam[bossLane]
				if ch == 1 {
					// Solo boss HP ≈ starter squad (50+43+28).
					if boss.BaseStats.HP < 100 {
						t.Fatalf("%s solo boss hp %d want >=100", id, boss.BaseStats.HP)
					}
					hasPierce := false
					for _, c := range boss.Deck {
						for _, tag := range c.Tags {
							if tag == "pierce" {
								hasPierce = true
							}
						}
					}
					if !hasPierce {
						t.Fatalf("%s solo boss needs pierce tags", id)
					}
				}
			} else {
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

// TestMythmir_Ch1SoloBoss_EmptyLanes — mid/back empty; boss alone front (D-051).
func TestMythmir_Ch1SoloBoss_EmptyLanes(t *testing.T) {
	cat := mythmirCatalog(t)
	b, err := mode.CreatePvE(cat, "solo", "mythmir_1_f3", 7, startersTeam, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	var p2 []*sim.Unit
	for _, u := range b.Units {
		if u.Side == sim.SideP2 {
			p2 = append(p2, u)
		}
	}
	if len(p2) != 3 {
		t.Fatalf("p2=%d", len(p2))
	}
	if p2[1].Alive || p2[2].Alive {
		t.Fatalf("empty lanes should be dead: %v %v", p2[1].Alive, p2[2].Alive)
	}
	if !p2[0].Alive || !strings.Contains(p2[0].ID, "pitboss") {
		t.Fatalf("front want living pitboss, got alive=%v id=%s", p2[0].Alive, p2[0].ID)
	}
}

// TestMythmir_StartersClearAllChapters — each stage clearable on full tank·DPS·support (D-042).
// Per-wave full squad (not attrition carry): harder soldiers must punish no-heal runs for humans,
// while AutoPlay still proves every mythmir_*_f* is beatable on starters. CarryAlive covered separately.
func TestMythmir_StartersClearAllChapters(t *testing.T) {
	cat := mythmirCatalog(t)
	for ch := 1; ch <= 5; ch++ {
		for f := 1; f <= 3; f++ {
			id := fmt.Sprintf("mythmir_%d_f%d", ch, f)
			b, err := mode.CreatePvE(cat, "clear_"+id, id, int64(20261118+ch*10+f), startersTeam, nil, []bool{true, true, true})
			if err != nil {
				t.Fatalf("%s create: %v", id, err)
			}
			if err := b.AutoPlay(160); err != nil {
				t.Fatalf("%s auto: %v", id, err)
			}
			if b.Result != sim.ResultP1Win {
				t.Fatalf("%s result=%s turn=%d want p1_win (faction=%s)", id, b.Result, b.Turn, wantFaction[ch])
			}
		}
	}
}
