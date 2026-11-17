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

func loadCat(t *testing.T) *content.Catalog {
	t.Helper()
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("caller")
	}
	root := filepath.Clean(filepath.Join(filepath.Dir(file), "..", "..", "..", "content"))
	cat, err := content.LoadCatalog(root)
	if err != nil {
		t.Fatal(err)
	}
	return cat
}

func TestPracticeBotSpendsEnergy(t *testing.T) {
	cat := loadCat(t)
	team := []string{"starter_tank_stone", "starter_fighter_fire", "starter_support_water"}
	b, err := mode.CreatePvE(cat, "probe", "practice_dummy_1", 42, team, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	// Decks must be shop attack cards (integration).
	for _, u := range b.Units {
		if u.Side != sim.SideP2 {
			continue
		}
		for _, c := range u.Deck {
			if !strings.Contains(c.CardID, "shop_") {
				t.Fatalf("practice bot %s card %s is not a shop attack card", u.ID, c.CardID)
			}
		}
	}
	emptyEnds := 0
	botPlays := 0
	botAttacks := 0
	for !b.Finished() && b.Turn < 40 {
		if b.Active == sim.SideP1 {
			for !b.Finished() {
				a := b.ChooseAction()
				if a.Kind == sim.ActionEndTurn {
					break
				}
				if err := b.SubmitAction(a); err != nil {
					t.Fatalf("p1 play: %v", err)
				}
			}
			if b.Finished() {
				break
			}
			if err := b.SubmitAction(sim.Action{Kind: sim.ActionEndTurn}); err != nil {
				t.Fatal(err)
			}
		}
		for !b.Finished() && b.Active == sim.SideP2 {
			a := b.ChooseAction()
			eBefore := b.P2.Energy
			var played *content.CardDef
			if a.Kind == sim.ActionPlayCard {
				u := unitByID(b, a.UnitID)
				if u != nil && a.HandIndex >= 0 && a.HandIndex < len(u.Hand) {
					c := u.Deck[u.Hand[a.HandIndex]]
					played = &c
				}
			}
			if err := b.SubmitAction(a); err != nil {
				t.Fatalf("bot %v: %v e=%d", a, err, eBefore)
			}
			if a.Kind == sim.ActionPlayCard {
				botPlays++
				if played != nil && played.Atk > 0 {
					botAttacks++
				}
			} else if a.Kind == sim.ActionEndTurn && eBefore > 0 {
				// leftover only OK if no affordable card remained
				afford := 0
				for _, u := range b.Units {
					if u.Side != sim.SideP2 || !u.Alive {
						continue
					}
					for _, hi := range u.Hand {
						if u.Deck[hi].Cost <= eBefore {
							afford++
						}
					}
				}
				if afford > 0 {
					emptyEnds++
					t.Logf("empty end turn=%d e=%d afford=%d", b.Turn, eBefore, afford)
				}
			}
		}
	}
	t.Logf("result=%s botPlays=%d botAttacks=%d emptyEnds=%d turns=%d", b.Result, botPlays, botAttacks, emptyEnds, b.Turn)
	if emptyEnds > 0 {
		t.Fatalf("bot ended with leftover spendable energy %d times", emptyEnds)
	}
	if botPlays == 0 {
		t.Fatal("bot never played a card")
	}
	if botAttacks == 0 {
		t.Fatal("bot never played an attack card")
	}
	if b.Result == sim.ResultNone {
		t.Fatal("battle did not finish")
	}
}

func unitByID(b *sim.Battle, id string) *sim.Unit {
	for _, u := range b.Units {
		if u.ID == id {
			return u
		}
	}
	return nil
}

func TestPracticeAutoPlayCompletes(t *testing.T) {
	cat := loadCat(t)
	team := []string{"starter_tank_stone", "starter_fighter_fire", "starter_support_water"}
	b, err := mode.CreatePvE(cat, "auto", "practice_dummy_1", 20261110, team, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	if err := b.AutoPlay(40); err != nil {
		t.Fatal(err)
	}
	if !b.Finished() {
		t.Fatalf("autoplay unfinished result=%s turn=%d", b.Result, b.Turn)
	}
	t.Logf("auto result=%s turn=%d frames=%d", b.Result, b.Turn, len(b.Frames))
}
