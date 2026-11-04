package economy

import (
	"time"
)

const utcDateLayout = "2006-01-02"

// RefillDaily — §8.3 daily refill bowls/tickets, TZ = UTC (§16).
// В новый UTC-день выставляет bowls/pvpTickets в дневной кап (§5 free или pass ×2).
// Возвращает true, если рефилл выполнен.
func RefillDaily(p *Player, now time.Time, lim Limits) bool {
	if p == nil {
		return false
	}
	day := now.UTC().Format(utcDateLayout)
	if p.LastRefillUTCDate == day {
		return false
	}
	pve, pvp := lim.CapsFor(p.PassActive(now.UTC()))
	p.Bowls = pve
	p.PvPTickets = pvp
	p.LastRefillUTCDate = day
	return true
}

// EnsureReady — рефилл при необходимости, затем текущие остатки.
func EnsureReady(p *Player, now time.Time, lim Limits) {
	RefillDaily(p, now, lim)
}
