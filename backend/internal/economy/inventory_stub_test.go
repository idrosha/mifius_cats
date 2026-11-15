package economy

import "testing"

func TestListGearStubEmpty(t *testing.T) {
	p := NewPlayer("u1")
	if got := ListGear(p); len(got) != 0 {
		t.Fatalf("ListGear stub want empty, got %d", len(got))
	}
}

func TestEquipGearStubFalse(t *testing.T) {
	p := NewPlayer("u1")
	if EquipGear(p, "c1", "grey_helm") {
		t.Fatal("EquipGear stub must return false until storage exists")
	}
}
