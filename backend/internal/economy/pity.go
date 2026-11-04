package economy

// PityConfig — FULL-SPEC §5 Gacha pity soft50 / hard80 (same with Pass).
// LiveOps §7.4 `pity` подставляет remote; дефолт здесь SSOT.
type PityConfig struct {
	Soft int
	Hard int
}

// DefaultPity — FULL-SPEC §5 / §13.4.
func DefaultPity() PityConfig {
	return PityConfig{Soft: 50, Hard: 80}
}

// PityState — persisted pulls-since-hit per jar table (§8.3 pity state).
// Не поле Player §7.5 — отдельный storage key (Nakama), чтобы не расширять схему игрока.
type PityState struct {
	// Since[tableID] = число открытий с последнего pity-хита (rare+).
	Since map[string]int
}

// NewPityState — пустой счётчик.
func NewPityState() *PityState {
	return &PityState{Since: make(map[string]int)}
}

func (s *PityState) since(tableID string) int {
	if s == nil || s.Since == nil {
		return 0
	}
	return s.Since[tableID]
}

func (s *PityState) setSince(tableID string, n int) {
	if s.Since == nil {
		s.Since = make(map[string]int)
	}
	s.Since[tableID] = n
}

// SoftActive — счётчик достиг soft (§5 soft50); шансы/UI — позже; здесь флаг для §12 odds.
func (s *PityState) SoftActive(tableID string, cfg PityConfig) bool {
	return s.since(tableID) >= cfg.Soft
}
