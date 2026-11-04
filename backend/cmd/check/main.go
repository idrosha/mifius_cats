// check — smoke CLI: free 3/5 лимиты и pass ×2 (FULL-SPEC §5 / §13.2–3).
package main

import (
	"fmt"
	"os"
	"time"

	"github.com/idrosha/mir_games/backend/internal/economy"
)

func main() {
	lim := economy.DefaultLimits()
	now := time.Date(2026, 11, 4, 12, 0, 0, 0, time.UTC)

	free := economy.NewPlayer("demo-free")
	economy.RefillDaily(free, now, lim)
	pass := economy.NewPlayer("demo-pass")
	_ = economy.ActivatePass(pass, now.Add(48*time.Hour))
	economy.RefillDaily(pass, now, lim)

	fmt.Printf("free bowls/tickets: %d/%d (want 3/5)\n", free.Bowls, free.PvPTickets)
	fmt.Printf("pass bowls/tickets: %d/%d (want 6/10) adsHidden=%v\n",
		pass.Bowls, pass.PvPTickets, pass.AdsHidden(now))

	if free.Bowls != 3 || free.PvPTickets != 5 || pass.Bowls != 6 || pass.PvPTickets != 10 {
		os.Exit(1)
	}
}
