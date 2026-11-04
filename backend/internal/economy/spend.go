package economy

import (
	"errors"
	"time"
)

var (
	ErrNilPlayer       = errors.New("economy: nil player")
	ErrNoBowls         = errors.New("economy: no bowls left")         // PvE cost §4.1
	ErrNoPvPTickets    = errors.New("economy: no pvp tickets left")   // PvP cost §4.2
	ErrInsufficientSoft = errors.New("economy: insufficient currency")
)

// SpendBowl — вход в Двор (§4.1 cost 1 bowl). Server-side (§13.2).
func SpendBowl(p *Player, now time.Time, lim Limits) error {
	if p == nil {
		return ErrNilPlayer
	}
	EnsureReady(p, now, lim)
	if p.Bowls < 1 {
		return ErrNoBowls
	}
	p.Bowls--
	return nil
}

// SpendPvPTicket — вход в дуэль/арену (§4.2 cost 1 pvp ticket). Server-side (§13.2).
func SpendPvPTicket(p *Player, now time.Time, lim Limits) error {
	if p == nil {
		return ErrNilPlayer
	}
	EnsureReady(p, now, lim)
	if p.PvPTickets < 1 {
		return ErrNoPvPTickets
	}
	p.PvPTickets--
	return nil
}

// Grant — начисление валют только server-side (§8.3 / skill backend).
// Отрицательные дельты игнорируются (списание — через Spend*).
func Grant(p *Player, fish, yarn, scrap, medals int) error {
	if p == nil {
		return ErrNilPlayer
	}
	if fish > 0 {
		p.Fish += fish
	}
	if yarn > 0 {
		p.Yarn += yarn
	}
	if scrap > 0 {
		p.Scrap += scrap
	}
	if medals > 0 {
		p.Medals += medals
	}
	return nil
}

// SpendFish — soft currency spend (§2.5 fish).
func SpendFish(p *Player, amount int) error {
	if p == nil {
		return ErrNilPlayer
	}
	if amount < 0 || p.Fish < amount {
		return ErrInsufficientSoft
	}
	p.Fish -= amount
	return nil
}

// SpendYarn — premium spend (§2.5 yarn); IAP grant остаётся отдельно (§8.3 validate IAP — не в этом slice).
func SpendYarn(p *Player, amount int) error {
	if p == nil {
		return ErrNilPlayer
	}
	if amount < 0 || p.Yarn < amount {
		return ErrInsufficientSoft
	}
	p.Yarn -= amount
	return nil
}

// ActivatePass — §8.3 activate pass; until = PassActiveUntil (§7.5).
func ActivatePass(p *Player, until time.Time) error {
	if p == nil {
		return ErrNilPlayer
	}
	p.PassActiveUntil = until.UTC()
	return nil
}
