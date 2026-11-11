package content

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// LoadCatalog loads Phase 1 content from a content/ root directory.
func LoadCatalog(root string) (*Catalog, error) {
	cat := &Catalog{
		Cards:    map[string]CardDef{},
		Parts:    map[string]PartDef{},
		Starters: map[string]CatTemplate{},
		Stages:   map[string]StageDef{},
	}

	cardFiles, err := filepath.Glob(filepath.Join(root, "cards", "*.json"))
	if err != nil {
		return nil, err
	}
	for _, f := range cardFiles {
		var c CardDef
		if err := readJSON(f, &c); err != nil {
			return nil, fmt.Errorf("card %s: %w", f, err)
		}
		if c.CardID == "" {
			return nil, fmt.Errorf("card %s: empty cardId", f)
		}
		cat.Cards[c.CardID] = c
	}

	partFiles, err := filepath.Glob(filepath.Join(root, "parts", "*.json"))
	if err != nil {
		return nil, err
	}
	for _, f := range partFiles {
		var parts []PartDef
		if err := readJSON(f, &parts); err != nil {
			return nil, fmt.Errorf("parts %s: %w", f, err)
		}
		for _, p := range parts {
			if p.PartID == "" {
				return nil, fmt.Errorf("parts %s: empty partId", f)
			}
			cat.Parts[p.PartID] = p
		}
	}

	catFiles, err := filepath.Glob(filepath.Join(root, "cats", "*.json"))
	if err != nil {
		return nil, err
	}
	if len(catFiles) == 0 {
		return nil, fmt.Errorf("cats: no json files")
	}
	for _, f := range catFiles {
		var starters []CatTemplate
		if err := readJSON(f, &starters); err != nil {
			return nil, fmt.Errorf("cats %s: %w", f, err)
		}
		for _, s := range starters {
			cat.Starters[s.TemplateID] = s
		}
	}

	stageFiles, err := filepath.Glob(filepath.Join(root, "stages", "*.json"))
	if err != nil {
		return nil, err
	}
	for _, f := range stageFiles {
		var s StageDef
		if err := readJSON(f, &s); err != nil {
			return nil, fmt.Errorf("stage %s: %w", f, err)
		}
		cat.Stages[s.StageID] = s
	}

	if err := cat.validate(); err != nil {
		return nil, err
	}
	return cat, nil
}

func (c *Catalog) validate() error {
	if len(c.Starters) < 3 {
		return fmt.Errorf("need ≥3 starters, got %d", len(c.Starters))
	}
	required := []string{"starter_tank_stone", "starter_fighter_fire", "starter_support_water"}
	for _, id := range required {
		if _, ok := c.Starters[id]; !ok {
			return fmt.Errorf("missing starter %s", id)
		}
	}
	if len(c.Cards) < 12 {
		return fmt.Errorf("need ≥12 cards, got %d", len(c.Cards))
	}
	for _, s := range c.Starters {
		for slot, partID := range s.Parts {
			p, ok := c.Parts[partID]
			if !ok {
				return fmt.Errorf("starter %s missing part %s", s.TemplateID, partID)
			}
			if p.Slot != slot {
				return fmt.Errorf("part %s slot mismatch: %s vs %s", partID, p.Slot, slot)
			}
			// N=6: eyes/ears/muzzle/headwear/back/tail each grant one attack card.
			if p.CardID == nil || *p.CardID == "" {
				return fmt.Errorf("part %s needs cardId", partID)
			}
			if _, ok := c.Cards[*p.CardID]; !ok {
				return fmt.Errorf("part %s references missing card %s", partID, *p.CardID)
			}
		}
	}
	return nil
}

// DeckForStarter resolves the N=6 card defs from eyes/ears/muzzle/headwear/back/tail.
func (c *Catalog) DeckForStarter(templateID string) ([]CardDef, error) {
	s, ok := c.Starters[templateID]
	if !ok {
		return nil, fmt.Errorf("unknown starter %s", templateID)
	}
	order := []string{"eyes", "ears", "muzzle", "headwear", "back", "tail"}
	out := make([]CardDef, 0, 6)
	for _, slot := range order {
		partID, ok := s.Parts[slot]
		if !ok {
			return nil, fmt.Errorf("%s missing %s", templateID, slot)
		}
		p := c.Parts[partID]
		if p.CardID == nil || *p.CardID == "" {
			return nil, fmt.Errorf("%s part %s missing cardId", templateID, partID)
		}
		card, ok := c.Cards[*p.CardID]
		if !ok {
			return nil, fmt.Errorf("missing card for %s", partID)
		}
		out = append(out, card)
	}
	return out, nil
}

func readJSON(path string, dst any) error {
	b, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	return json.Unmarshal(b, dst)
}
