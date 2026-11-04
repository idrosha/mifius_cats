// Package softlaunch — Phase 4 geo gate helpers (§14 limited geo). Ops allowlist only; no store secrets.
package softlaunch

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

// GeoAllowlist — ISO 3166-1 alpha-2 regions for soft launch (§14).
type GeoAllowlist struct {
	Allowlist []string `json:"allowlist"`
}

// LoadGeoAllowlist reads ops JSON { "allowlist": ["RU", ...] }.
func LoadGeoAllowlist(path string) (*GeoAllowlist, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var g GeoAllowlist
	if err := json.Unmarshal(raw, &g); err != nil {
		return nil, fmt.Errorf("geo allowlist json: %w", err)
	}
	if err := g.Validate(); err != nil {
		return nil, err
	}
	return &g, nil
}

// Validate — non-empty, unique, ISO alpha-2 uppercase.
func (g *GeoAllowlist) Validate() error {
	if g == nil || len(g.Allowlist) == 0 {
		return fmt.Errorf("geo allowlist: empty")
	}
	seen := make(map[string]struct{}, len(g.Allowlist))
	for i, r := range g.Allowlist {
		code := strings.ToUpper(strings.TrimSpace(r))
		if len(code) != 2 {
			return fmt.Errorf("geo allowlist[%d]: want ISO alpha-2, got %q", i, r)
		}
		for _, c := range code {
			if c < 'A' || c > 'Z' {
				return fmt.Errorf("geo allowlist[%d]: want A-Z letters, got %q", i, r)
			}
		}
		if _, ok := seen[code]; ok {
			return fmt.Errorf("geo allowlist: duplicate %q", code)
		}
		seen[code] = struct{}{}
		g.Allowlist[i] = code
	}
	return nil
}

// Allows reports whether region (ISO alpha-2) is in the soft-launch geo set.
func (g *GeoAllowlist) Allows(region string) bool {
	if g == nil {
		return false
	}
	want := strings.ToUpper(strings.TrimSpace(region))
	for _, r := range g.Allowlist {
		if r == want {
			return true
		}
	}
	return false
}
