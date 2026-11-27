package economy

// Limits — дневные капы free-игрока (§5). Pass умножает ×2 (SL/Full) или использует
// явные PvEPerDayPass/PvPPerDayPass (MVP Beta D-066: 4 PvE / 10 PvP).
type Limits struct {
	PvEPerDay     int // free bowls/day
	PvPPerDay     int // free pvp tickets/day
	PvEPerDayPass int // optional explicit pass cap (0 → PvEPerDay*2)
	PvPPerDayPass int // optional explicit pass cap (0 → PvPPerDay*2)
}

// DefaultLimits — FULL-SPEC §5 Free: PvE 3, PvP 5 (SL/Full pass = ×2 → 6/10).
func DefaultLimits() Limits {
	return Limits{PvEPerDay: 3, PvPPerDay: 5}
}

// MVPBetaLimits — FULL-SPEC §1.1, §5 / D-066: Free 3/5, Pass ACTIVE 4 PvE / 10 PvP.
func MVPBetaLimits() Limits {
	return Limits{
		PvEPerDay:     3,
		PvPPerDay:     5,
		PvEPerDayPass: 4,
		PvPPerDayPass: 10,
	}
}

// CapsFor возвращает дневные капы с учётом пасса.
func (l Limits) CapsFor(passActive bool) (pve, pvp int) {
	pve, pvp = l.PvEPerDay, l.PvPPerDay
	if passActive {
		if l.PvEPerDayPass > 0 {
			pve = l.PvEPerDayPass
		} else {
			pve *= 2
		}
		if l.PvPPerDayPass > 0 {
			pvp = l.PvPPerDayPass
		} else {
			pvp *= 2
		}
	}
	return pve, pvp
}
