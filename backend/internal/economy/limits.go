package economy

// Limits — дневные капы free-игрока (§5). Pass умножает ×2 (§5 / §13.3).
// LiveOps позже подставит remote `limits` (§7.4 / §13.10); дефолт здесь SSOT.
type Limits struct {
	PvEPerDay int // free bowls/day
	PvPPerDay int // free pvp tickets/day
}

// DefaultLimits — FULL-SPEC §5 Free: PvE 3, PvP 5.
func DefaultLimits() Limits {
	return Limits{PvEPerDay: 3, PvPPerDay: 5}
}

// CapsFor возвращает дневные капы с учётом пасса (§5 Pass = ×2).
func (l Limits) CapsFor(passActive bool) (pve, pvp int) {
	pve, pvp = l.PvEPerDay, l.PvPPerDay
	if passActive {
		pve *= 2
		pvp *= 2
	}
	return pve, pvp
}
