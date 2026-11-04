// check — smoke CLI: limits §5 + pity hard80 + IAP sandbox yarn→jar (§13.2–4 / §13.9).
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

	pity := economy.DefaultPity()
	fmt.Printf("pity soft/hard: %d/%d (want 50/80)\n", pity.Soft, pity.Hard)
	if pity.Soft != 50 || pity.Hard != 80 {
		os.Exit(1)
	}

	p := economy.NewPlayer("demo-pity")
	state := economy.NewPityState()
	pool := economy.DefaultStaticJarPool()
	state.Since[economy.JarTableCats] = pity.Hard - 1
	drop, err := economy.OpenJar(p, state, economy.JarTableCats, pity, pool, economy.OpenJarOpts{})
	if err != nil || !drop.PityTriggered || drop.Rarity != "rare" {
		fmt.Printf("hard80 pity failed: drop=%+v err=%v\n", drop, err)
		os.Exit(1)
	}
	fmt.Printf("hard80 pity: triggered=%v rarity=%s\n", drop.PityTriggered, drop.Rarity)

	iapUser := economy.NewPlayer("demo-iap")
	ledger := economy.NewMemoryIAPLedger()
	jar, err := economy.SandboxYarnThenJar(
		iapUser, ledger,
		economy.IAPReceipt{
			Platform: "sandbox", ProductKind: economy.IAPKindYarn,
			ProductID: "sandbox.yarn.unit", TransactionID: "smoke-tx-1", YarnGrant: 1,
		},
		economy.NewPityState(), pity, pool, economy.JarTableCats, 1,
	)
	if err != nil || jar.Origin != "jar" || iapUser.Yarn != 0 {
		fmt.Printf("iap yarn→jar failed: jar=%+v yarn=%d err=%v\n", jar, iapUser.Yarn, err)
		os.Exit(1)
	}
	fmt.Printf("iap sandbox yarn→jar: origin=%s template=%s yarn_left=%d\n", jar.Origin, jar.TemplateID, iapUser.Yarn)
}
