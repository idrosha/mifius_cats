package economy

import (
	"errors"
	"time"
)

var (
	ErrNoDungeonKey      = errors.New("economy: no dungeon key")
	ErrUnknownDungeonKey = errors.New("economy: unknown dungeon key id")
)

// StarterDungeonKeys — soft-launch grant (docs/dungeons-coop-3.md).
var StarterDungeonKeys = map[string]int{
	"scarlet": 3,
	"howl":    2,
	"whisper": 2,
}

// DungeonKeyFishCost — buy key with soft currency (catalog SSOT mirrored).
var DungeonKeyFishCost = map[string]int{
	"scarlet": 80,
	"howl":    90,
	"whisper": 110,
}

// EnsureDungeonBags initializes dungeon maps on Player.
func EnsureDungeonBags(p *Player) {
	if p == nil {
		return
	}
	if p.DungeonKeys == nil {
		p.DungeonKeys = map[string]int{}
	}
	if p.DungeonFirstClear == nil {
		p.DungeonFirstClear = map[string]bool{}
	}
	if p.DungeonRares == nil {
		p.DungeonRares = []string{}
	}
	if p.DungeonMats == nil {
		p.DungeonMats = map[string]int{}
	}
}

// SeedDungeonKeys grants starter keys once (idempotent).
func SeedDungeonKeys(p *Player) error {
	if p == nil {
		return ErrNilPlayer
	}
	EnsureDungeonBags(p)
	if p.DungeonKeysSeeded {
		return nil
	}
	for id, n := range StarterDungeonKeys {
		if _, ok := p.DungeonKeys[id]; !ok {
			p.DungeonKeys[id] = n
		}
	}
	p.DungeonKeysSeeded = true
	return nil
}

// SpendDungeonKey — вход в кооп-данж (1 ключ).
func SpendDungeonKey(p *Player, dungeonID string) error {
	if p == nil {
		return ErrNilPlayer
	}
	EnsureDungeonBags(p)
	if _, ok := DungeonKeyFishCost[dungeonID]; !ok {
		return ErrUnknownDungeonKey
	}
	if p.DungeonKeys[dungeonID] < 1 {
		return ErrNoDungeonKey
	}
	p.DungeonKeys[dungeonID]--
	return nil
}

// BuyDungeonKey — fish → +1 key.
func BuyDungeonKey(p *Player, dungeonID string) error {
	if p == nil {
		return ErrNilPlayer
	}
	EnsureDungeonBags(p)
	cost, ok := DungeonKeyFishCost[dungeonID]
	if !ok {
		return ErrUnknownDungeonKey
	}
	if err := SpendFish(p, cost); err != nil {
		return err
	}
	p.DungeonKeys[dungeonID]++
	return nil
}

// MarkDungeonFirstClear — once per dungeon id.
func MarkDungeonFirstClear(p *Player, dungeonID string) bool {
	if p == nil {
		return false
	}
	EnsureDungeonBags(p)
	if p.DungeonFirstClear[dungeonID] {
		return false
	}
	p.DungeonFirstClear[dungeonID] = true
	p.DungeonRuns++
	return true
}

// GrantDungeonRare appends rare item id (inventory SoT stub).
func GrantDungeonRare(p *Player, rareID string) error {
	if p == nil {
		return ErrNilPlayer
	}
	if rareID == "" {
		return errors.New("economy: empty rare id")
	}
	EnsureDungeonBags(p)
	p.DungeonRares = append(p.DungeonRares, rareID)
	return nil
}

// GrantDungeonMat stacks unique path mats.
func GrantDungeonMat(p *Player, matID string, qty int) error {
	if p == nil {
		return ErrNilPlayer
	}
	if matID == "" || qty < 1 {
		return errors.New("economy: bad mat grant")
	}
	EnsureDungeonBags(p)
	p.DungeonMats[matID] += qty
	return nil
}

// DungeonSnapshot for API/HUD.
func DungeonSnapshot(p *Player, now time.Time) map[string]any {
	_ = now
	EnsureDungeonBags(p)
	keys := map[string]int{}
	for k, v := range p.DungeonKeys {
		keys[k] = v
	}
	return map[string]any{
		"keys":       keys,
		"firstClear": p.DungeonFirstClear,
		"rares":      p.DungeonRares,
		"mats":       p.DungeonMats,
		"runs":       p.DungeonRuns,
		"seeded":     p.DungeonKeysSeeded,
	}
}
