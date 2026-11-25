package battle_test

import (
	"strings"
	"testing"

	"github.com/idrosha/mir_games/battle/internal/content"
)

// Art-gem cost snapshot for elven-18 shop kits (playable SoT = content JSON). D-059.
// Cost 2 only where the plate gem still shows 2; others are cost 1.
var wikiShopCost2 = map[string]bool{
	"card_shop_assassin_water_back": true,
	"card_shop_assassin_wind_back":  true,
	"card_shop_fighter_fire_back":   true,
	"card_shop_fighter_water_muzzle": true,
	"card_shop_fighter_wind_back":   true,
	"card_shop_mage_fire_back":      true,
	"card_shop_mage_fire_muzzle":    true,
	"card_shop_mage_water_back":     true,
	"card_shop_mage_water_eyes":     true,
	"card_shop_mage_wind_back":      true,
	"card_shop_ranger_water_back":   true,
	"card_shop_ranger_water_muzzle": true,
	"card_shop_support_fire_back":   true,
	"card_shop_support_water_back":  true,
	"card_shop_support_wind_back":   true,
}

func TestShopCardCosts_MatchWikiSnapshot(t *testing.T) {
	cat, err := content.LoadCatalog(contentRoot(t))
	if err != nil {
		t.Fatal(err)
	}
	var shop int
	for id, c := range cat.Cards {
		if !strings.HasPrefix(id, "card_shop_") {
			continue
		}
		shop++
		want2 := wikiShopCost2[id]
		if want2 && c.Cost != 2 {
			t.Errorf("%s: wiki/D-059 cost 2, JSON cost=%d", id, c.Cost)
		}
		if !want2 && c.Cost != 1 {
			t.Errorf("%s: expected cost 1 (not in cost-2 set), JSON cost=%d", id, c.Cost)
		}
	}
	if shop != 108 {
		t.Fatalf("want 108 shop cards (18×6), got %d", shop)
	}
	// D-035/D-059: tank water tail = cost 1 backline pierce.
	if c, ok := cat.Cards["card_shop_tank_water_tail"]; !ok || c.Cost != 1 || c.TargetRule != "backline" {
		t.Fatalf("tank water tail: want cost 1 backline pierce, got cost=%d rule=%s ok=%v", c.Cost, c.TargetRule, ok)
	}
}
