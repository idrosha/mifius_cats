package battle_test

import (
	"strings"
	"testing"

	"github.com/idrosha/mir_games/battle/internal/content"
)

// Art-gem cost snapshot for shop 12-hero kits (playable SoT = content JSON).
// Cost 2 only where the plate gem still shows 2; replaced plates with gem 1 are cost 1.
var wikiShopCost2 = map[string]bool{
	"card_shop_fighter_fire_b_back":  true,
	"card_shop_assassin_bolt_a_tail": true,
	"card_shop_assassin_bolt_b_tail": true,
	"card_shop_mage_ice_b_eyes":      true,
	"card_shop_support_water_a_back": true,
	"card_shop_support_water_b_back": true,
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
			t.Errorf("%s: wiki/D-035 cost 2, JSON cost=%d", id, c.Cost)
		}
		if !want2 && c.Cost != 1 {
			t.Errorf("%s: expected cost 1 (not in wiki cost-2 set), JSON cost=%d", id, c.Cost)
		}
	}
	if shop != 72 {
		t.Fatalf("want 72 shop cards (12×6), got %d", shop)
	}
	// D-035: tank B backline pierce stays cost 1.
	if c, ok := cat.Cards["card_shop_tank_stone_b_tail"]; !ok || c.Cost != 1 || c.TargetRule != "backline" {
		t.Fatalf("tank B tail: want cost 1 backline pierce, got cost=%d rule=%s ok=%v", c.Cost, c.TargetRule, ok)
	}
}
