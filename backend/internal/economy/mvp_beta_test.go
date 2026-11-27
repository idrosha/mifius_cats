package economy

import (
	"errors"
	"testing"
	"time"
)

func TestMVPBetaLimits_3_5_Free_And_4_10_Pass(t *testing.T) {
	lim := MVPBetaLimits()
	pve, pvp := lim.CapsFor(false)
	if pve != 3 || pvp != 5 {
		t.Fatalf("mvp free want 3/5, got %d/%d", pve, pvp)
	}
	pve, pvp = lim.CapsFor(true)
	if pve != 4 || pvp != 10 {
		t.Fatalf("mvp pass want 4/10, got %d/%d", pve, pvp)
	}

	p := NewPlayer("mvp_u1")
	p.MVPBeta = true
	day := utc(2026, 11, 27, 9, 0)
	if !p.AdsHidden(day) {
		t.Fatal("mvp_beta must have no ads even without pass")
	}
	_ = ActivatePass(p, day.Add(28*24*time.Hour))
	RefillDaily(p, day, lim)
	if p.Bowls != 4 || p.PvPTickets != 10 {
		t.Fatalf("mvp pass refill want 4/10, got %d/%d", p.Bowls, p.PvPTickets)
	}
	for i := 0; i < 4; i++ {
		if err := SpendBowl(p, day, lim); err != nil {
			t.Fatalf("bowl %d: %v", i+1, err)
		}
	}
	if err := SpendBowl(p, day, lim); !errors.Is(err, ErrNoBowls) {
		t.Fatalf("5th PvE in mvp pass want ErrNoBowls, got %v", err)
	}
}

func TestMVPBeta_ShopGachaBlocked(t *testing.T) {
	p := NewPlayer("mvp_u2")
	p.MVPBeta = true
	_, err := OpenJar(p, &PityState{}, JarTableCats, DefaultPity(), nil, OpenJarOpts{})
	if !errors.Is(err, ErrShopGachaDisabled) {
		t.Fatalf("want ErrShopGachaDisabled, got %v", err)
	}
}

func TestMVPBeta_PassFinaleRandomCat_And_CatRankXP(t *testing.T) {
	p := NewPlayer("mvp_u3")
	p.MVPBeta = true
	p.Cats = []CatInstance{{CatID: "c1", TemplateID: "starter_tank_stone", Level: 1}}
	day := utc(2026, 11, 27, 10, 0)

	// Free = 1x XP
	got, err := AddCatRankXP(p, "c1", 60, day)
	if err != nil || got != 60 || p.Cats[0].Level != 1 {
		t.Fatalf("free xp mismatch: got=%d lvl=%d err=%v", got, p.Cats[0].Level, err)
	}
	// Pass ACTIVE = 2x XP → levels up to R2
	_ = ActivatePass(p, day.Add(28*24*time.Hour))
	got, err = AddCatRankXP(p, "c1", 60, day)
	if err != nil || got != 120 || p.Cats[0].Level != 2 {
		t.Fatalf("pass 2x xp mismatch: got=%d lvl=%d err=%v", got, p.Cats[0].Level, err)
	}

	pool := []CatInstance{
		{TemplateID: "shop_tank_fire", Role: "tank", Element: "fire"},
		{TemplateID: "shop_mage_water", Role: "mage", Element: "water"},
	}
	cat, err := ClaimPassFinaleCat(p, "mvp_beta_s1", pool, func(n int) int { return 1 })
	if err != nil || cat.TemplateID != "shop_mage_water" || cat.Origin != "pass_finale" {
		t.Fatalf("pass finale cat mismatch: %+v err=%v", cat, err)
	}
	if _, err := ClaimPassFinaleCat(p, "mvp_beta_s1", pool, func(n int) int { return 0 }); !errors.Is(err, ErrPassFinaleClaimed) {
		t.Fatalf("duplicate claim want ErrPassFinaleClaimed, got %v", err)
	}
}

func TestMVPBeta_DailyQuests_Email_SeasonDecay(t *testing.T) {
	p := NewPlayer("mvp_u4")
	if err := LinkEmail(p, "Player@Example.com"); err != nil || p.LinkedEmail != "player@example.com" {
		t.Fatalf("link email failed: %v %q", err, p.LinkedEmail)
	}
	if err := LinkEmail(p, "not-an-email"); !errors.Is(err, ErrInvalidEmail) {
		t.Fatalf("invalid email want ErrInvalidEmail, got %v", err)
	}

	defs := []DailyQuestDef{
		{QuestID: "dq_pve_1", Kind: "pve_battle", Target: 1, RewardFish: 50, RewardPassXP: 200},
	}
	day := utc(2026, 11, 27, 12, 0)
	AdvanceDailyQuest(p, day, defs, "pve_battle", 1)
	fish, xp, err := ClaimDailyQuest(p, day, defs[0])
	if err != nil || fish != 50 || xp != 200 || p.Fish != 50 {
		t.Fatalf("claim quest mismatch: fish=%d xp=%d p.Fish=%d err=%v", fish, xp, p.Fish, err)
	}
	if _, _, err := ClaimDailyQuest(p, day, defs[0]); !errors.Is(err, ErrQuestAlreadyClaimed) {
		t.Fatalf("double claim want ErrQuestAlreadyClaimed, got %v", err)
	}

	if decayed := SoftDecayMMR(1600, 1200, 0.25); decayed != 1500 {
		t.Fatalf("soft decay want 1500, got %d", decayed)
	}
	if tier := SeasonPrizeTier(1, 20); tier != "top_1" {
		t.Fatalf("rank 1 want top_1, got %s", tier)
	}
	if tier := SeasonPrizeTier(1500, 5); tier != "participation" {
		t.Fatalf("participation want participation, got %s", tier)
	}
}
