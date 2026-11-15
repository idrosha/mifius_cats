package economy

// Inventory stub (D-028 Wave B) — not Nakama-wired.
// HUD soft-launch uses local gearCatalog; these helpers document the future RPC surface.

// GearItem — owned warehouse row (HUD slots stub until pendant/bow SSOT migration).
type GearItem struct {
	ID      string
	Slot    string
	Name    string
	Rarity  string
	Enhance int
}

// ListGear — stub list; empty until storage exists.
func ListGear(_ *Player) []GearItem {
	return nil
}

// EquipGear — stub; returns false (no persist). Battle must not call this as SoT.
func EquipGear(_ *Player, _catID, _itemID string) bool {
	return false
}
