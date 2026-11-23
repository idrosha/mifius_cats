package battle_test

import (
	"strings"
	"testing"

	"github.com/idrosha/mir_games/battle/internal/content"
	"github.com/idrosha/mir_games/battle/internal/mode"
	"github.com/idrosha/mir_games/battle/internal/sim"
)

func TestSmoke_N6GapHeroesDeckAndHand(t *testing.T) {
	cat, err := content.LoadCatalog(contentRoot(t))
	if err != nil {
		t.Fatal(err)
	}
	ids := []string{"shop_tank_stone_a", "shop_tank_stone_b", "shop_fighter_fire_a"}
	for _, id := range ids {
		deck, err := cat.DeckForStarter(id)
		if err != nil {
			t.Fatal(err)
		}
		if len(deck) != 6 {
			t.Fatalf("%s deck=%d", id, len(deck))
		}
		if deck[0].CardID != "card_"+id+"_eyes" || deck[1].CardID != "card_"+id+"_ears" {
			t.Fatalf("%s order want eyes/ears first got %s %s", id, deck[0].CardID, deck[1].CardID)
		}
		seen := map[string]bool{}
		for _, c := range deck {
			seen[c.CardID] = true
		}
		if len(seen) != 6 {
			t.Fatalf("%s unique=%d", id, len(seen))
		}
	}
	b, err := mode.CreatePvE(cat, "smoke_n6", "practice_dummy_1", 42, ids, nil, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	for _, u := range b.Units {
		if u.Side != sim.SideP1 {
			continue
		}
		if len(u.Deck) != 6 {
			t.Fatalf("%s deck=%d", u.ID, len(u.Deck))
		}
		if len(u.Hand) != 2 { // D2
			t.Fatalf("%s hand=%d want D2", u.ID, len(u.Hand))
		}
		hasEyes, hasEars := false, false
		for _, c := range u.Deck {
			if strings.HasSuffix(c.CardID, "_eyes") {
				hasEyes = true
			}
			if strings.HasSuffix(c.CardID, "_ears") {
				hasEars = true
			}
		}
		if !hasEyes || !hasEars {
			t.Fatalf("%s missing eyes/ears in deck", u.ID)
		}
	}
}
