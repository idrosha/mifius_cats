package economy

import (
	"errors"
	"testing"
)

func TestDefaultPity_SSOT_Section5(t *testing.T) {
	cfg := DefaultPity()
	if cfg.Soft != 50 || cfg.Hard != 80 {
		t.Fatalf("pity want soft50/hard80, got %d/%d", cfg.Soft, cfg.Hard)
	}
}

func TestOpenJar_HardPityTriggersAt80(t *testing.T) {
	cfg := DefaultPity()
	p := NewPlayer("pity-u")
	state := NewPityState()
	pool := DefaultStaticJarPool()

	// 79 common pulls → since=79; soft active from 50.
	for i := 0; i < cfg.Hard-1; i++ {
		drop, err := OpenJar(p, state, JarTableCats, cfg, pool, OpenJarOpts{})
		if err != nil {
			t.Fatalf("pull %d: %v", i+1, err)
		}
		if drop.PityTriggered {
			t.Fatalf("pull %d must not hard-pity yet", i+1)
		}
		if drop.Rarity != "common" {
			t.Fatalf("pull %d want common (static pool), got %s", i+1, drop.Rarity)
		}
	}
	if state.since(JarTableCats) != cfg.Hard-1 {
		t.Fatalf("since want %d, got %d", cfg.Hard-1, state.since(JarTableCats))
	}
	if !state.SoftActive(JarTableCats, cfg) {
		t.Fatal("soft50 should be active before hard80")
	}

	drop, err := OpenJar(p, state, JarTableCats, cfg, pool, OpenJarOpts{})
	if err != nil {
		t.Fatal(err)
	}
	if !drop.PityTriggered {
		t.Fatal("§13.4: hard 80 must trigger pity")
	}
	if drop.Rarity != "rare" {
		t.Fatalf("hard pity rarity want rare, got %s", drop.Rarity)
	}
	if drop.Origin != "jar" {
		t.Fatalf("origin want jar, got %s", drop.Origin)
	}
	if drop.TemplateID == "" {
		t.Fatal("cats pity drop must include templateId")
	}
	if state.since(JarTableCats) != 0 {
		t.Fatalf("pity counter must reset, got %d", state.since(JarTableCats))
	}
}

func TestOpenJar_HardPity_GearTable(t *testing.T) {
	cfg := DefaultPity()
	p := NewPlayer("pity-gear")
	state := NewPityState()
	pool := DefaultStaticJarPool()
	state.setSince(JarTableGear, cfg.Hard-1)

	drop, err := OpenJar(p, state, JarTableGear, cfg, pool, OpenJarOpts{})
	if err != nil {
		t.Fatal(err)
	}
	if !drop.PityTriggered || drop.Rarity != "rare" || drop.PartID == "" {
		t.Fatalf("gear hard pity failed: %+v", drop)
	}
}

func TestOpenJar_UnknownTable(t *testing.T) {
	_, err := OpenJar(NewPlayer("u"), NewPityState(), "nursery", DefaultPity(), DefaultStaticJarPool(), OpenJarOpts{})
	if !errors.Is(err, ErrUnknownJarTable) {
		t.Fatalf("want ErrUnknownJarTable, got %v", err)
	}
}

func TestOpenJar_SpendYarn(t *testing.T) {
	p := NewPlayer("yarn-jar")
	_ = Grant(p, 0, 2, 0, 0)
	_, err := OpenJar(p, NewPityState(), JarTableCats, DefaultPity(), DefaultStaticJarPool(), OpenJarOpts{YarnCost: 1})
	if err != nil {
		t.Fatal(err)
	}
	if p.Yarn != 1 {
		t.Fatalf("yarn want 1, got %d", p.Yarn)
	}
	_, err = OpenJar(p, NewPityState(), JarTableCats, DefaultPity(), DefaultStaticJarPool(), OpenJarOpts{YarnCost: 2})
	if !errors.Is(err, ErrInsufficientSoft) {
		t.Fatalf("want ErrInsufficientSoft, got %v", err)
	}
}

func TestIAPSandbox_YarnThenJar(t *testing.T) {
	p := NewPlayer("iap-u")
	ledger := NewMemoryIAPLedger()
	state := NewPityState()
	cfg := DefaultPity()
	pool := DefaultStaticJarPool()

	receipt := IAPReceipt{
		Platform:      "sandbox",
		ProductKind:   IAPKindYarn,
		ProductID:     "sandbox.yarn.unit",
		TransactionID: "tx-sandbox-1",
		YarnGrant:     1,
	}

	drop, err := SandboxYarnThenJar(p, ledger, receipt, state, cfg, pool, JarTableCats, 1)
	if err != nil {
		t.Fatal(err)
	}
	if p.Yarn != 0 {
		t.Fatalf("after yarn→jar yarn want 0, got %d", p.Yarn)
	}
	if drop.Origin != "jar" || drop.TemplateID == "" {
		t.Fatalf("jar drop incomplete: %+v", drop)
	}

	// duplicate tx rejected
	err = ValidateAndGrantIAP(p, receipt, ledger)
	if !errors.Is(err, ErrIAPDuplicateTx) {
		t.Fatalf("want ErrIAPDuplicateTx, got %v", err)
	}
}

func TestIAPSandbox_RejectsNonSandboxAndBadKind(t *testing.T) {
	p := NewPlayer("iap-bad")
	ledger := NewMemoryIAPLedger()
	err := ValidateAndGrantIAP(p, IAPReceipt{
		Platform: "appstore", ProductKind: IAPKindYarn, ProductID: "x", TransactionID: "t1", YarnGrant: 1,
	}, ledger)
	if !errors.Is(err, ErrIAPNotSandbox) {
		t.Fatalf("want ErrIAPNotSandbox, got %v", err)
	}
	err = ValidateAndGrantIAP(p, IAPReceipt{
		Platform: "sandbox", ProductKind: "nft_pack", ProductID: "x", TransactionID: "t2", YarnGrant: 1,
	}, ledger)
	if !errors.Is(err, ErrIAPUnknownKind) {
		t.Fatalf("want ErrIAPUnknownKind, got %v", err)
	}
	err = ValidateAndGrantIAP(p, IAPReceipt{
		Platform: "sandbox", ProductKind: IAPKindYarn, ProductID: "x", TransactionID: "t3", YarnGrant: 0,
	}, ledger)
	if !errors.Is(err, ErrIAPYarnGrantMissing) {
		t.Fatalf("want ErrIAPYarnGrantMissing, got %v", err)
	}
}

func TestIAPSandbox_YarnGrantOnly(t *testing.T) {
	p := NewPlayer("iap-yarn")
	ledger := NewMemoryIAPLedger()
	err := ValidateAndGrantIAP(p, IAPReceipt{
		Platform: "sandbox", ProductKind: IAPKindYarn,
		ProductID: "sandbox.yarn.unit", TransactionID: "tx-y", YarnGrant: 5,
	}, ledger)
	if err != nil {
		t.Fatal(err)
	}
	if p.Yarn != 5 {
		t.Fatalf("yarn want 5, got %d", p.Yarn)
	}
}
