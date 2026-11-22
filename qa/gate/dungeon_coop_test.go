package gate_test

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestDungeonCoop_CatalogPresent(t *testing.T) {
	root := repoRoot(t)
	path := filepath.Join(root, "content", "campaign", "dungeons_coop_v1.json")
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var doc struct {
		Version  int `json:"version"`
		Timing   struct {
			ShortMaxMin int `json:"shortMaxMin"`
			LongMaxMin  int `json:"longMaxMin"`
		} `json:"timing"`
		Party struct {
			Combat     string `json:"combat"`
			MaxPlayers int    `json:"maxPlayers"`
		} `json:"party"`
		Dungeons []struct {
			ID string `json:"id"`
		} `json:"dungeons"`
	}
	if err := json.Unmarshal(raw, &doc); err != nil {
		t.Fatal(err)
	}
	if doc.Version < 3 {
		t.Fatalf("version=%d want ≥3", doc.Version)
	}
	if doc.Timing.ShortMaxMin != 10 || doc.Timing.LongMaxMin != 15 {
		t.Fatalf("timing %d/%d want 10/15", doc.Timing.ShortMaxMin, doc.Timing.LongMaxMin)
	}
	if doc.Party.Combat != "3v3" || doc.Party.MaxPlayers != 4 {
		t.Fatalf("party combat=%s max=%d", doc.Party.Combat, doc.Party.MaxPlayers)
	}
	if len(doc.Dungeons) != 3 {
		t.Fatalf("dungeons=%d want 3", len(doc.Dungeons))
	}
	// Stages on disk for every short/long node.
	var full struct {
		Dungeons []struct {
			ID    string `json:"id"`
			Paths map[string]struct {
				Nodes []string `json:"nodes"`
			} `json:"paths"`
		} `json:"dungeons"`
	}
	if err := json.Unmarshal(raw, &full); err != nil {
		t.Fatal(err)
	}
	for _, d := range full.Dungeons {
		for pathName, path := range d.Paths {
			for _, sid := range path.Nodes {
				stagePath := filepath.Join(root, "content", "stages", sid+".json")
				if _, err := os.Stat(stagePath); err != nil {
					t.Fatalf("%s/%s missing stage file %s", d.ID, pathName, sid)
				}
			}
		}
	}
}
