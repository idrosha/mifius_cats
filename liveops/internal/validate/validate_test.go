package validate_test

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"mythfel-liveops/internal/validate"
)

func repoRoot(t *testing.T) string {
	t.Helper()
	wd, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	// internal/validate → liveops → repo
	return filepath.Clean(filepath.Join(wd, "..", "..", ".."))
}

func TestV1ConfigValid(t *testing.T) {
	root := repoRoot(t)
	schema := filepath.Join(root, "liveops", "schemas", "liveops.schema.json")
	cfg := filepath.Join(root, "liveops", "config", "v1", "liveops.json")
	content := filepath.Join(root, "content")

	sch, err := validate.LoadSchema(schema)
	if err != nil {
		t.Fatal(err)
	}
	ids, err := validate.LoadContentIDs(content)
	if err != nil {
		t.Fatal(err)
	}
	r := validate.ValidateFile(sch, cfg, ids)
	if !r.OK() {
		t.Fatalf("v1 liveops invalid: %v", r.Errors)
	}
	if len(ids.Cards) < 12 {
		t.Fatalf("expected ≥12 cards, got %d", len(ids.Cards))
	}
}

func TestUnknownCardRefFails(t *testing.T) {
	root := repoRoot(t)
	schema := filepath.Join(root, "liveops", "schemas", "liveops.schema.json")
	content := filepath.Join(root, "content")

	raw, err := os.ReadFile(filepath.Join(root, "liveops", "config", "v1", "liveops.json"))
	if err != nil {
		t.Fatal(err)
	}
	var doc map[string]any
	if err := json.Unmarshal(raw, &doc); err != nil {
		t.Fatal(err)
	}
	shop := doc["shop"].(map[string]any)
	shop["offers"] = []any{
		map[string]any{
			"offer_id": "bad_offer",
			"kind":     "gacha_jar",
			"card_id":  "card_does_not_exist",
		},
	}

	dir := t.TempDir()
	badPath := filepath.Join(dir, "bad.json")
	b, _ := json.Marshal(doc)
	if err := os.WriteFile(badPath, b, 0o644); err != nil {
		t.Fatal(err)
	}

	sch, err := validate.LoadSchema(schema)
	if err != nil {
		t.Fatal(err)
	}
	ids, err := validate.LoadContentIDs(content)
	if err != nil {
		t.Fatal(err)
	}
	r := validate.ValidateFile(sch, badPath, ids)
	if r.OK() {
		t.Fatal("expected unknown card_id to fail")
	}
	found := false
	for _, e := range r.Errors {
		if contains(e, "card_does_not_exist") {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected card_does_not_exist in errors, got %v", r.Errors)
	}
}

func TestSchemaRejectsMissingKey(t *testing.T) {
	root := repoRoot(t)
	schema := filepath.Join(root, "liveops", "schemas", "liveops.schema.json")
	sch, err := validate.LoadSchema(schema)
	if err != nil {
		t.Fatal(err)
	}
	dir := t.TempDir()
	path := filepath.Join(dir, "empty.json")
	if err := os.WriteFile(path, []byte(`{"version":"1"}`), 0o644); err != nil {
		t.Fatal(err)
	}
	r := validate.ValidateFile(sch, path, &validate.ContentIDs{
		Cards: map[string]struct{}{}, Parts: map[string]struct{}{},
		Templates: map[string]struct{}{}, Stages: map[string]struct{}{},
	})
	if r.OK() {
		t.Fatal("expected schema failure for incomplete config")
	}
}

func contains(s, sub string) bool {
	return len(s) >= len(sub) && (s == sub || len(sub) == 0 ||
		(func() bool {
			for i := 0; i+len(sub) <= len(s); i++ {
				if s[i:i+len(sub)] == sub {
					return true
				}
			}
			return false
		})())
}
