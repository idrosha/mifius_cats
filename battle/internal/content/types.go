package content

// CardDef — FULL-SPEC §7.2.
type CardDef struct {
	CardID     string         `json:"cardId"`
	NameKey    string         `json:"name_key"`
	RoleGate   string         `json:"roleGate,omitempty"`
	Element    string         `json:"element"`
	Cost       int            `json:"cost"`
	Atk        int            `json:"atk"`
	Shield     int            `json:"shield"`
	Hits       int            `json:"hits"`
	TargetRule string         `json:"targetRule"`
	Tags       []string       `json:"tags"`
	EffectOps  []map[string]any `json:"effectOps"`
}

// PartDef — FULL-SPEC §7.3.
type PartDef struct {
	PartID     string           `json:"partId"`
	Slot       string           `json:"slot"`
	Element    string           `json:"element"`
	CardID     *string          `json:"cardId"`
	PassiveOps []map[string]any `json:"passiveOps"`
	ArtKey     string           `json:"artKey"`
	Rarity     string           `json:"rarity"`
}

// CatTemplate — starter / bot template (§7.1 fields used at spawn).
type CatTemplate struct {
	TemplateID string            `json:"templateId"`
	Role       string            `json:"role"`
	Element    string            `json:"element"`
	Level      int               `json:"level"`
	BaseStats  Stats             `json:"baseStats"`
	Parts      map[string]string `json:"parts"`
	Rarity     string            `json:"rarity"`
	Origin     string            `json:"origin"`
	Deck       []CardDef         `json:"deck,omitempty"` // bot stage inline decks
}

type Stats struct {
	HP    int `json:"hp"`
	Atk   int `json:"atk"`
	Spd   int `json:"spd"`
	Skill int `json:"skill"`
	Charm int `json:"charm"`
}

// StageDef — PvE node (§4.1); enemy decks may be inline for Phase 1.
type StageDef struct {
	StageID   string        `json:"stageId"`
	Chapter   int           `json:"chapter"`
	NameKey   string        `json:"name_key"`
	BowlCost  int           `json:"bowlCost"`
	EnemyTeam []CatTemplate `json:"enemyTeam"`
}

type Catalog struct {
	Cards    map[string]CardDef
	Parts    map[string]PartDef
	Starters map[string]CatTemplate
	Stages   map[string]StageDef
}
