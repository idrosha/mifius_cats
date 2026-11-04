package economy

import "testing"

func TestGrantStarterKit_EqualDecksNoGear(t *testing.T) {
	p, err := NewPlayerWithStarter("u-smoke")
	if err != nil {
		t.Fatal(err)
	}
	if p.Fish != 200 || p.Scrap != 20 || p.Yarn != 0 || p.Medals != 0 {
		t.Fatalf("currency: fish=%d scrap=%d yarn=%d medals=%d", p.Fish, p.Scrap, p.Yarn, p.Medals)
	}
	if p.Bowls != 3 || p.PvPTickets != 5 {
		t.Fatalf("limits: bowls=%d tickets=%d", p.Bowls, p.PvPTickets)
	}
	if len(p.Cats) != 4 {
		t.Fatalf("cats=%d want 4", len(p.Cats))
	}
	want := []string{"starter_tank_stone", "starter_fighter_fire", "starter_support_water", "starter_farm_grass"}
	for i, id := range want {
		if p.Cats[i].TemplateID != id {
			t.Fatalf("cat[%d]=%s want %s", i, p.Cats[i].TemplateID, id)
		}
		if p.Cats[i].PendantID != "" || len(p.Cats[i].BowByPart) != 0 {
			t.Fatalf("starter gear must be empty for %s", id)
		}
	}
	if p.Cats[3].Origin != "farm" {
		t.Fatalf("farm origin=%s", p.Cats[3].Origin)
	}
	if len(p.Potions) != 6 {
		t.Fatalf("potions=%d want 6", len(p.Potions))
	}
	for _, s := range p.Potions {
		if s.Count != 1 {
			t.Fatalf("potion %s count=%d", s.PotionID, s.Count)
		}
	}
	if len(p.Presets[0].CatIDs) != 3 {
		t.Fatalf("preset lanes=%d", len(p.Presets[0].CatIDs))
	}
	// Idempotent reject
	if err := GrantStarterKit(p); err == nil {
		t.Fatal("expected already-granted error")
	}
}

func TestGrantStarterKit_identicalAcrossAccounts(t *testing.T) {
	a, _ := NewPlayerWithStarter("a")
	b, _ := NewPlayerWithStarter("b")
	for i := range a.Cats {
		if a.Cats[i].TemplateID != b.Cats[i].TemplateID || a.Cats[i].Origin != b.Cats[i].Origin {
			t.Fatalf("equal decks broken at cat %d", i)
		}
	}
	for i := range a.Potions {
		if a.Potions[i].PotionID != b.Potions[i].PotionID || a.Potions[i].Count != b.Potions[i].Count {
			t.Fatalf("equal potion kit broken at %d", i)
		}
	}
}
