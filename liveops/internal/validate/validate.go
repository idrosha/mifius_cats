// Package validate — LiveOps JSON Schema + content id refs (FULL-SPEC §7.4 / §8.4).
package validate

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/santhosh-tekuri/jsonschema/v5"
)

// ContentIDs — known ids from content/ (cards, parts, cat templates, stages).
type ContentIDs struct {
	Cards     map[string]struct{}
	Parts     map[string]struct{}
	Templates map[string]struct{}
	Stages    map[string]struct{}
}

// Result of one config file validation.
type Result struct {
	ConfigPath string
	Errors     []string
}

func (r Result) OK() bool { return len(r.Errors) == 0 }

// LoadSchema compiles liveops.schema.json.
func LoadSchema(schemaPath string) (*jsonschema.Schema, error) {
	abs, err := filepath.Abs(schemaPath)
	if err != nil {
		return nil, err
	}
	c := jsonschema.NewCompiler()
	c.Draft = jsonschema.Draft2020
	sch, err := c.Compile("file://" + filepath.ToSlash(abs))
	if err != nil {
		return nil, fmt.Errorf("compile schema: %w", err)
	}
	return sch, nil
}

// LoadContentIDs scans content root for cardId / partId / templateId / stageId.
func LoadContentIDs(contentRoot string) (*ContentIDs, error) {
	ids := &ContentIDs{
		Cards:     map[string]struct{}{},
		Parts:     map[string]struct{}{},
		Templates: map[string]struct{}{},
		Stages:    map[string]struct{}{},
	}

	cardFiles, err := filepath.Glob(filepath.Join(contentRoot, "cards", "*.json"))
	if err != nil {
		return nil, err
	}
	for _, f := range cardFiles {
		var c struct {
			CardID string `json:"cardId"`
		}
		if err := readJSON(f, &c); err != nil {
			return nil, fmt.Errorf("card %s: %w", f, err)
		}
		if c.CardID == "" {
			return nil, fmt.Errorf("card %s: empty cardId", f)
		}
		ids.Cards[c.CardID] = struct{}{}
	}

	partFiles, err := filepath.Glob(filepath.Join(contentRoot, "parts", "*.json"))
	if err != nil {
		return nil, err
	}
	for _, f := range partFiles {
		var parts []struct {
			PartID string `json:"partId"`
		}
		if err := readJSON(f, &parts); err != nil {
			return nil, fmt.Errorf("parts %s: %w", f, err)
		}
		for _, p := range parts {
			if p.PartID == "" {
				return nil, fmt.Errorf("parts %s: empty partId", f)
			}
			ids.Parts[p.PartID] = struct{}{}
		}
	}

	catFiles, err := filepath.Glob(filepath.Join(contentRoot, "cats", "*.json"))
	if err != nil {
		return nil, err
	}
	for _, starterPath := range catFiles {
		var starters []struct {
			TemplateID string `json:"templateId"`
		}
		if err := readJSON(starterPath, &starters); err != nil {
			return nil, fmt.Errorf("cats %s: %w", starterPath, err)
		}
		for _, s := range starters {
			if s.TemplateID != "" {
				ids.Templates[s.TemplateID] = struct{}{}
			}
		}
	}

	stageFiles, err := filepath.Glob(filepath.Join(contentRoot, "stages", "*.json"))
	if err != nil {
		return nil, err
	}
	for _, f := range stageFiles {
		var s struct {
			StageID string `json:"stageId"`
		}
		if err := readJSON(f, &s); err != nil {
			return nil, fmt.Errorf("stage %s: %w", f, err)
		}
		if s.StageID != "" {
			ids.Stages[s.StageID] = struct{}{}
		}
	}

	return ids, nil
}

// ValidateFile schema-checks config and resolves shop offer content refs.
func ValidateFile(sch *jsonschema.Schema, configPath string, ids *ContentIDs) Result {
	r := Result{ConfigPath: configPath}
	raw, err := os.ReadFile(configPath)
	if err != nil {
		r.Errors = append(r.Errors, err.Error())
		return r
	}
	var doc any
	if err := json.Unmarshal(raw, &doc); err != nil {
		r.Errors = append(r.Errors, fmt.Sprintf("json: %v", err))
		return r
	}
	if err := sch.Validate(doc); err != nil {
		r.Errors = append(r.Errors, fmt.Sprintf("schema: %v", err))
		return r
	}
	r.Errors = append(r.Errors, checkRefs(doc, ids)...)
	return r
}

func checkRefs(doc any, ids *ContentIDs) []string {
	if ids == nil {
		return nil
	}
	root, ok := doc.(map[string]any)
	if !ok {
		return nil
	}
	shop, _ := root["shop"].(map[string]any)
	if shop == nil {
		return nil
	}
	offers, _ := shop["offers"].([]any)
	var errs []string
	for i, o := range offers {
		om, ok := o.(map[string]any)
		if !ok {
			continue
		}
		if v, ok := om["card_id"].(string); ok && v != "" {
			if _, ok := ids.Cards[v]; !ok {
				errs = append(errs, fmt.Sprintf("shop.offers[%d].card_id unknown: %q", i, v))
			}
		}
		if v, ok := om["part_id"].(string); ok && v != "" {
			if _, ok := ids.Parts[v]; !ok {
				errs = append(errs, fmt.Sprintf("shop.offers[%d].part_id unknown: %q", i, v))
			}
		}
		if v, ok := om["template_id"].(string); ok && v != "" {
			if _, ok := ids.Templates[v]; !ok {
				errs = append(errs, fmt.Sprintf("shop.offers[%d].template_id unknown: %q", i, v))
			}
		}
		if v, ok := om["stage_id"].(string); ok && v != "" {
			if _, ok := ids.Stages[v]; !ok {
				errs = append(errs, fmt.Sprintf("shop.offers[%d].stage_id unknown: %q", i, v))
			}
		}
	}
	return errs
}

// ValidateTree validates every *.json under configDir against schema + content ids.
func ValidateTree(schemaPath, configDir, contentRoot string) ([]Result, error) {
	sch, err := LoadSchema(schemaPath)
	if err != nil {
		return nil, err
	}
	ids, err := LoadContentIDs(contentRoot)
	if err != nil {
		return nil, err
	}
	var results []Result
	err = filepath.WalkDir(configDir, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() || !strings.HasSuffix(d.Name(), ".json") {
			return nil
		}
		results = append(results, ValidateFile(sch, path, ids))
		return nil
	})
	return results, err
}

func readJSON(path string, v any) error {
	b, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	return json.Unmarshal(b, v)
}
