package economy

import (
	"errors"
	"strings"
)

// IAP product kinds — FULL-SPEC §5: yarn packs, pass, slot expand, maybe jar bundles.
// Совпадает с LiveOps shop.offer_kinds (§7.4); без выдуманных SKU/цен.
const (
	IAPKindYarn       = "yarn"
	IAPKindPass       = "pass"
	IAPKindSlotExpand = "slot_expand"
	IAPKindGachaJar   = "gacha_jar"
)

var (
	ErrInvalidIAP        = errors.New("economy: invalid iap receipt")
	ErrIAPDuplicateTx    = errors.New("economy: duplicate iap transaction")
	ErrIAPUnknownKind    = errors.New("economy: unknown iap product kind")
	ErrIAPNotSandbox     = errors.New("economy: non-sandbox iap not wired")
	ErrIAPYarnGrantMissing = errors.New("economy: sandbox yarn receipt missing yarn_grant")
)

// IAPReceipt — вход validate IAP (§8.3). Цены/store SKU не из SSOT — sandbox несёт grant.
type IAPReceipt struct {
	Platform      string // только "sandbox" в этом slice (§13.9)
	ProductKind   string // yarn|pass|slot_expand|gacha_jar
	ProductID     string // opaque id от стора/теста; не каталог цен
	TransactionID string
	// YarnGrant — сколько yarn начислить при kind=yarn (sandbox payload).
	// Не store price: shop.offers пуст (§7.4); production catalog — отдельно.
	YarnGrant int
}

// IAPLedger — идемпотентность transaction_id (Nakama storage / wallet later).
type IAPLedger interface {
	Seen(txID string) bool
	Mark(txID string)
}

// MemoryIAPLedger — in-memory для тестов/smoke.
type MemoryIAPLedger struct {
	seen map[string]bool
}

func NewMemoryIAPLedger() *MemoryIAPLedger {
	return &MemoryIAPLedger{seen: make(map[string]bool)}
}

func (l *MemoryIAPLedger) Seen(txID string) bool {
	if l == nil || l.seen == nil {
		return false
	}
	return l.seen[txID]
}

func (l *MemoryIAPLedger) Mark(txID string) {
	if l.seen == nil {
		l.seen = make(map[string]bool)
	}
	l.seen[txID] = true
}

// ValidateAndGrantIAP — §8.3 validate IAP receipt; grant currency только server-side.
// Production store verify — не в этом slice; sandbox (§13.9) принимает Platform=sandbox.
func ValidateAndGrantIAP(p *Player, r IAPReceipt, ledger IAPLedger) error {
	if p == nil {
		return ErrNilPlayer
	}
	if ledger == nil {
		return ErrInvalidIAP
	}
	if strings.TrimSpace(r.TransactionID) == "" || strings.TrimSpace(r.ProductID) == "" {
		return ErrInvalidIAP
	}
	if !validIAPKind(r.ProductKind) {
		return ErrIAPUnknownKind
	}
	if !strings.EqualFold(r.Platform, "sandbox") {
		return ErrIAPNotSandbox
	}
	if ledger.Seen(r.TransactionID) {
		return ErrIAPDuplicateTx
	}

	switch r.ProductKind {
	case IAPKindYarn:
		if r.YarnGrant < 1 {
			return ErrIAPYarnGrantMissing
		}
		if err := Grant(p, 0, r.YarnGrant, 0, 0); err != nil {
			return err
		}
	case IAPKindPass:
		// Активация пасса требует until — без длительности в SSOT не выдумываем срок здесь.
		// Sandbox pass → отдельный ActivatePass от caller; этот kind только идемпотентный ack.
	case IAPKindSlotExpand, IAPKindGachaJar:
		// Слоты/jar bundle без priced catalog — validate-only до LiveOps offers.
	}

	ledger.Mark(r.TransactionID)
	return nil
}

func validIAPKind(kind string) bool {
	switch kind {
	case IAPKindYarn, IAPKindPass, IAPKindSlotExpand, IAPKindGachaJar:
		return true
	default:
		return false
	}
}

// SandboxYarnThenJar — §13.9 путь: IAP sandbox yarn → spend yarn → open jar.
// yarnCost — параметр вызова (не цена из SSOT); типичный sandbox: YarnGrant == yarnCost.
func SandboxYarnThenJar(
	p *Player,
	ledger IAPLedger,
	receipt IAPReceipt,
	state *PityState,
	cfg PityConfig,
	pool JarPool,
	tableID string,
	yarnCost int,
) (JarDrop, error) {
	if receipt.ProductKind != IAPKindYarn {
		return JarDrop{}, ErrIAPUnknownKind
	}
	if err := ValidateAndGrantIAP(p, receipt, ledger); err != nil {
		return JarDrop{}, err
	}
	return OpenJar(p, state, tableID, cfg, pool, OpenJarOpts{YarnCost: yarnCost})
}
