package economy

import "fmt"

// SL potion catalog (§10 / §5.1) — ×1 each on registration.
var StarterPotionIDs = []string{
	"potion_life",
	"potion_stone_skin",
	"potion_spark_claw",
	"potion_nine_lives",
	"potion_cleanse",
	"potion_mint",
}

// CombatStarterTemplates — equal decks / fair PvP (§2.1, §5.1).
var CombatStarterTemplates = []struct {
	TemplateID string
	Role       string
	Element    string
}{
	{"starter_tank_stone", "tank", "stone"},
	{"starter_fighter_fire", "fighter", "fire"},
	{"starter_support_water", "support", "water"},
}

// GrantStarterKit — атомарно с NewPlayer (§5.1).
// Идентичный кит для всех новых аккаунтов: 3 боевых + 1 farm-cat, зелья×1, без gear.
// Клиент не inventорит награды.
func GrantStarterKit(p *Player) error {
	if p == nil {
		return fmt.Errorf("nil player")
	}
	if len(p.Cats) > 0 || len(p.Potions) > 0 {
		return fmt.Errorf("starter kit already granted")
	}

	p.Fish = 200
	p.Scrap = 20
	p.Yarn = 0
	p.Medals = 0
	p.Bowls = 3
	p.PvPTickets = 5

	cats := make([]CatInstance, 0, 4)
	for i, t := range CombatStarterTemplates {
		cats = append(cats, CatInstance{
			CatID:      fmt.Sprintf("%s_c%d", p.UserID, i+1),
			TemplateID: t.TemplateID,
			Role:       t.Role,
			Element:    t.Element,
			Level:      1,
			XP:         0,
			Parts:      nil, // parts/cards from content templates — equal decks
			PendantID:  "",  // no starter gear
			BowByPart:  nil,
			Rarity:     "common",
			Origin:     "starter",
		})
	}
	cats = append(cats, CatInstance{
		CatID:      fmt.Sprintf("%s_farm1", p.UserID),
		TemplateID: "starter_farm_grass",
		Role:       "farm",
		Element:    "grass",
		Level:      1,
		Rarity:     "common",
		Origin:     "farm",
	})
	p.Cats = cats

	// Default preset: lane0 tank → lane1 fighter → lane2 support
	p.Presets[0] = Preset{
		Name:   "starter",
		CatIDs: []string{cats[0].CatID, cats[1].CatID, cats[2].CatID},
	}

	pots := make([]PotionStack, 0, len(StarterPotionIDs))
	for _, id := range StarterPotionIDs {
		pots = append(pots, PotionStack{PotionID: id, Count: 1})
	}
	p.Potions = pots
	return nil
}

// NewPlayerWithStarter — NewPlayer + GrantStarterKit (§5.1 / §8.3).
func NewPlayerWithStarter(userID string) (*Player, error) {
	p := NewPlayer(userID)
	if err := GrantStarterKit(p); err != nil {
		return nil, err
	}
	return p, nil
}
