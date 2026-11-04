package economy

import (
	"errors"
	"testing"
	"time"
)

func utc(y int, m time.Month, d, hh, mm int) time.Time {
	return time.Date(y, m, d, hh, mm, 0, 0, time.UTC)
}

func TestDefaultLimits_SSOT_Section5(t *testing.T) {
	lim := DefaultLimits()
	if lim.PvEPerDay != 3 || lim.PvPPerDay != 5 {
		t.Fatalf("free limits want 3/5, got %d/%d", lim.PvEPerDay, lim.PvPPerDay)
	}
	pve, pvp := lim.CapsFor(false)
	if pve != 3 || pvp != 5 {
		t.Fatalf("free caps want 3/5, got %d/%d", pve, pvp)
	}
	pve, pvp = lim.CapsFor(true)
	if pve != 6 || pvp != 10 {
		t.Fatalf("pass ×2 want 6/10, got %d/%d", pve, pvp)
	}
}

func TestRefillAndSpend_FreeDailyLimits(t *testing.T) {
	lim := DefaultLimits()
	p := NewPlayer("u1")
	day := utc(2026, 11, 4, 10, 0)

	if !RefillDaily(p, day, lim) {
		t.Fatal("expected first refill")
	}
	if p.Bowls != 3 || p.PvPTickets != 5 {
		t.Fatalf("after refill want bowls=3 tickets=5, got %d/%d", p.Bowls, p.PvPTickets)
	}
	if RefillDaily(p, day.Add(2*time.Hour), lim) {
		t.Fatal("same UTC day must not refill again")
	}

	for i := 0; i < 3; i++ {
		if err := SpendBowl(p, day, lim); err != nil {
			t.Fatalf("bowl %d: %v", i+1, err)
		}
	}
	if err := SpendBowl(p, day, lim); !errors.Is(err, ErrNoBowls) {
		t.Fatalf("4th PvE want ErrNoBowls, got %v", err)
	}

	for i := 0; i < 5; i++ {
		if err := SpendPvPTicket(p, day, lim); err != nil {
			t.Fatalf("ticket %d: %v", i+1, err)
		}
	}
	if err := SpendPvPTicket(p, day, lim); !errors.Is(err, ErrNoPvPTickets) {
		t.Fatalf("6th PvP want ErrNoPvPTickets, got %v", err)
	}
}

func TestPassDoublesLimits_AndNoAds(t *testing.T) {
	lim := DefaultLimits()
	p := NewPlayer("u2")
	day := utc(2026, 11, 4, 8, 0)
	_ = ActivatePass(p, day.Add(24*time.Hour))

	if !p.PassActive(day) {
		t.Fatal("pass should be active")
	}
	if !p.AdsHidden(day) {
		t.Fatal("pass → no-ads (§13.3)")
	}

	RefillDaily(p, day, lim)
	if p.Bowls != 6 || p.PvPTickets != 10 {
		t.Fatalf("pass refill want 6/10, got %d/%d", p.Bowls, p.PvPTickets)
	}
	for i := 0; i < 6; i++ {
		if err := SpendBowl(p, day, lim); err != nil {
			t.Fatalf("pass bowl %d: %v", i+1, err)
		}
	}
	if err := SpendBowl(p, day, lim); !errors.Is(err, ErrNoBowls) {
		t.Fatalf("7th want ErrNoBowls, got %v", err)
	}
}

func TestNextUTCDayRefills(t *testing.T) {
	lim := DefaultLimits()
	p := NewPlayer("u3")
	d1 := utc(2026, 11, 4, 23, 0)
	RefillDaily(p, d1, lim)
	_ = SpendBowl(p, d1, lim)
	_ = SpendBowl(p, d1, lim)

	d2 := utc(2026, 11, 5, 0, 0)
	if !RefillDaily(p, d2, lim) {
		t.Fatal("new UTC day should refill")
	}
	if p.Bowls != 3 || p.PvPTickets != 5 {
		t.Fatalf("new day free want 3/5, got %d/%d", p.Bowls, p.PvPTickets)
	}
}

func TestGrantAndSpendCurrency(t *testing.T) {
	p := NewPlayer("u4")
	if err := Grant(p, 10, 2, 3, 1); err != nil {
		t.Fatal(err)
	}
	if p.Fish != 10 || p.Yarn != 2 || p.Scrap != 3 || p.Medals != 1 {
		t.Fatalf("grant mismatch: %+v", p)
	}
	if err := Grant(p, -5, 0, 0, 0); err != nil {
		t.Fatal(err)
	}
	if p.Fish != 10 {
		t.Fatalf("negative grant must not reduce fish, got %d", p.Fish)
	}
	if err := SpendFish(p, 4); err != nil {
		t.Fatal(err)
	}
	if p.Fish != 6 {
		t.Fatalf("fish want 6, got %d", p.Fish)
	}
	if err := SpendFish(p, 100); !errors.Is(err, ErrInsufficientSoft) {
		t.Fatalf("want ErrInsufficientSoft, got %v", err)
	}
}

func TestPlayerSchemaFieldsPresent(t *testing.T) {
	// Smoke: §7.5 shape compiles and holds starters-shaped cat.
	p := NewPlayer("u5")
	p.Cats = append(p.Cats, CatInstance{
		CatID: "c1", TemplateID: "starter_tank_stone", Role: "tank", Element: "stone",
		Level: 1, Origin: "starter",
		Parts: map[string]string{"muzzle": "tank_stone_muzzle"},
	})
	p.Presets[0] = Preset{Name: "main", CatIDs: []string{"c1"}}
	p.Potions = []PotionStack{{PotionID: "mint_splash", Count: 1}}
	p.PendingAdsCap = 0
	if p.UserID == "" || len(p.Cats) != 1 {
		t.Fatal("player inventory smoke failed")
	}
}
