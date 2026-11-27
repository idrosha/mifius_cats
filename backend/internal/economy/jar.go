package economy

import (
	"errors"
	"fmt"
)

// Jar table IDs — FULL-SPEC §10: ровно 2 таблицы (cats, gear). Без выдуманных баннеров.
const (
	JarTableCats = "cats"
	JarTableGear = "gear"
)

var (
	ErrUnknownJarTable = errors.New("economy: unknown jar table")
	ErrNilPityState    = errors.New("economy: nil pity state")
	ErrNilJarPool      = errors.New("economy: nil jar pool")
)

// JarDrop — результат одного открытия (§8.3 open jar).
type JarDrop struct {
	TableID       string
	Rarity        string // common|rare|…; hard pity → минимум rare
	Origin        string // всегда "jar" (§7.1)
	TemplateID    string // cats table
	PartID        string // gear table
	PityTriggered bool   // true когда сработал hard pity (§13.4)
	SoftActive    bool   // счётчик ≥ soft до этого пулла
	PullsBefore   int    // since до инкремента
}

// JarPool — таблица дропа. Контент/LiveOps подставит веса; здесь только контракт.
// forcePity=true → обязан вернуть rarity rare+ (hard 80).
type JarPool interface {
	Roll(tableID string, forcePity bool) (JarDrop, error)
}

// OpenJarOpts — опции открытия. YarnCost не из прайс-листа SSOT (shop.offers пуст);
// передаётся вызывающим (sandbox §13.9 / будущий LiveOps offer). 0 = без списания yarn.
type OpenJarOpts struct {
	YarnCost int
}

// OpenJar — server RNG + pity (§8.3 / §5 / §13.4).
// Hard: на pull, когда since+1 >= hard → force pity rare, сброс счётчика.
// Soft: не меняет гарантию; SoftActive=true для отображения (§12); веса — в JarPool.
func OpenJar(p *Player, state *PityState, tableID string, cfg PityConfig, pool JarPool, opts OpenJarOpts) (JarDrop, error) {
	if p == nil {
		return JarDrop{}, ErrNilPlayer
	}
	if p.MVPBeta {
		return JarDrop{}, ErrShopGachaDisabled
	}
	if state == nil {
		return JarDrop{}, ErrNilPityState
	}
	if pool == nil {
		return JarDrop{}, ErrNilJarPool
	}
	if tableID != JarTableCats && tableID != JarTableGear {
		return JarDrop{}, fmt.Errorf("%w: %s", ErrUnknownJarTable, tableID)
	}
	if cfg.Hard < 1 || cfg.Soft < 1 {
		cfg = DefaultPity()
	}
	if opts.YarnCost < 0 {
		return JarDrop{}, ErrInsufficientSoft
	}
	if opts.YarnCost > 0 {
		if err := SpendYarn(p, opts.YarnCost); err != nil {
			return JarDrop{}, err
		}
	}

	before := state.since(tableID)
	softActive := before >= cfg.Soft
	force := before+1 >= cfg.Hard

	drop, err := pool.Roll(tableID, force)
	if err != nil {
		// вернуть yarn при отказе пула
		if opts.YarnCost > 0 {
			_ = Grant(p, 0, opts.YarnCost, 0, 0)
		}
		return JarDrop{}, err
	}
	drop.TableID = tableID
	drop.Origin = "jar"
	drop.PullsBefore = before
	drop.SoftActive = softActive
	drop.PityTriggered = force

	if force || isPityRarity(drop.Rarity) {
		state.setSince(tableID, 0)
		if isPityRarity(drop.Rarity) && !force {
			// натуральный rare+ тоже сбрасывает pity
			drop.PityTriggered = false
		}
	} else {
		state.setSince(tableID, before+1)
	}
	return drop, nil
}

func isPityRarity(r string) bool {
	switch r {
	case "rare", "epic", "legendary":
		return true
	default:
		return false
	}
}

// StaticJarPool — минимальный пул для тестов/smoke без выдуманных % дропа.
// forcePity → rare; иначе common. Источники ID — существующий content (starters/parts).
type StaticJarPool struct {
	CatsCommon []string
	CatsPity   []string
	GearCommon []string
	GearPity   []string
}

// DefaultStaticJarPool — ID из Phase1 content (starters + starter parts), не новый баланс.
func DefaultStaticJarPool() *StaticJarPool {
	return &StaticJarPool{
		CatsCommon: []string{"starter_tank_stone", "starter_fighter_fire", "starter_support_water"},
		CatsPity:   []string{"starter_tank_stone"},
		GearCommon: []string{"part_tank_stone_muzzle", "part_fighter_fire_muzzle", "part_support_water_muzzle"},
		GearPity:   []string{"part_tank_stone_muzzle"},
	}
}

func (p *StaticJarPool) Roll(tableID string, forcePity bool) (JarDrop, error) {
	if p == nil {
		return JarDrop{}, ErrNilJarPool
	}
	switch tableID {
	case JarTableCats:
		ids := p.CatsCommon
		rarity := "common"
		if forcePity {
			ids = p.CatsPity
			rarity = "rare"
		}
		if len(ids) == 0 {
			return JarDrop{}, errors.New("economy: empty cats jar pool")
		}
		return JarDrop{Rarity: rarity, TemplateID: ids[0]}, nil
	case JarTableGear:
		ids := p.GearCommon
		rarity := "common"
		if forcePity {
			ids = p.GearPity
			rarity = "rare"
		}
		if len(ids) == 0 {
			return JarDrop{}, errors.New("economy: empty gear jar pool")
		}
		return JarDrop{Rarity: rarity, PartID: ids[0]}, nil
	default:
		return JarDrop{}, fmt.Errorf("%w: %s", ErrUnknownJarTable, tableID)
	}
}
