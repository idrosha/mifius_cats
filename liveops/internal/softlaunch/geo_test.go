package softlaunch_test

import (
	"os"
	"path/filepath"
	"testing"

	"mythfel-liveops/internal/softlaunch"
)

func TestGeoAllowlist_AllowsExampleRegions(t *testing.T) {
	g := &softlaunch.GeoAllowlist{Allowlist: []string{"ru", "BY", "kz"}}
	if err := g.Validate(); err != nil {
		t.Fatal(err)
	}
	if !g.Allows("RU") || !g.Allows("by") || !g.Allows("KZ") {
		t.Fatalf("expected allowlist match after normalize: %#v", g.Allowlist)
	}
	if g.Allows("US") || g.Allows("") {
		t.Fatal("US / empty must be denied on limited geo")
	}
}

func TestGeoAllowlist_RejectsInvalid(t *testing.T) {
	cases := []*softlaunch.GeoAllowlist{
		{Allowlist: nil},
		{Allowlist: []string{}},
		{Allowlist: []string{"RUS"}},
		{Allowlist: []string{"R1"}},
		{Allowlist: []string{"RU", "ru"}},
	}
	for _, c := range cases {
		if err := c.Validate(); err == nil {
			t.Fatalf("want error for %#v", c.Allowlist)
		}
	}
}

func TestLoadGeoAllowlist_ExampleFile(t *testing.T) {
	root := findRepoRoot(t)
	path := filepath.Join(root, "liveops", "soft-launch", "geo_allowlist.example.json")
	g, err := softlaunch.LoadGeoAllowlist(path)
	if err != nil {
		t.Fatal(err)
	}
	if !g.Allows("RU") {
		t.Fatalf("example allowlist should include RU: %#v", g.Allowlist)
	}
}

func findRepoRoot(t *testing.T) string {
	t.Helper()
	wd, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	dir := wd
	for i := 0; i < 6; i++ {
		if _, err := os.Stat(filepath.Join(dir, "liveops", "schemas", "liveops.schema.json")); err == nil {
			return dir
		}
		dir = filepath.Dir(dir)
	}
	t.Fatal("repo root not found")
	return ""
}
