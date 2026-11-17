# Agents export — Мифиус / mir_games

Portable catalog of agent briefs used by the **Мифиус** Cursor Project (`mir_games`).  
Paste into another Project’s store `docs/` (or kickoff prompts). Pair with repo `docs/AGENTS.md` + `docs/skills/*`.

**Snapshot:** 2026-11-10 · cloud workers inventory ≈ **119** on this env/repo · **2 RUNNING** · **3 ERROR** · rest **IDLE**.

---

## How to use in another Project

1. Copy this file + attach repo `docs/AGENTS.md` and `docs/skills/<role>.md`.
2. Keep **one coordinator** that owns the tracker (`taskPrefix`, e.g. `MF`) and store paths.
3. Spawn **one worker per outcome**; parallel only on non-overlapping paths.
4. Do **not** attach marketing/SEO/ponytail user skills unless the task is a landing/site.
5. Never paste `FULL-SPEC.md` into the prompt — cite `docs/FULL-SPEC.md` §N.

### Kickoff shape (universal)

```
Роль: <role-id from this catalog>
SSOT: docs/FULL-SPEC.md
Секции: §...
Скилл: docs/skills/<role>.md
Prefs: Project preferences.md (locked decisions only)
Сделать: <1 результат>
Не делать: <границы + anti-overlap>
Входы: <paths>
Выходы: <paths / PR>
DoD: <check from §13 or explicit accept>
Tracker: MF-NN (if Project tracker)
```

---

## A. Coordinator

### `coordinator` — Project orchestrator (Мифиус)

| Field | Value |
|---|---|
| **Role** | Route work → one role; own tracker; merge-ready PRs; no game code |
| **Skills** | `docs/skills/orchestrator.md` |
| **Inputs** | Tracker tasks; `preferences.md`; `docs/AGENTS.md`; FULL-SPEC TOC (§0–§1, §14) |
| **Outputs** | Worker kickoffs; task status; merge after green CI |
| **Anti-overlap** | Never code “for everyone”. One worker = one MF task / one PR topic. Do not re-spawn HUD/Stitch/SSOT workers while an IDLE peer still owns that topic. |

**Store conventions (reuse):**

| Path | Purpose |
|---|---|
| `docs/` | User-facing deliverables (wiki, stitch prompts, nav IA, checklists) |
| `internal/` | Worker evidence, QA logs, import maps (not player-facing) |
| `media/` | Screenshots / etalon PNGs |
| `preferences.md` | Locked product decisions (combat unity, shops channels, nav, Stitch rules) |
| Tracker prefix | `MF` (task keys `MF-NN`) |

---

## B. Repo roles (SSOT-coded)

Source of truth for code agents: repo `docs/AGENTS.md`.

### `battle` — combat simulator

| Field | Value |
|---|---|
| **Role** | Server-authoritative 3v3 battle sim + card effect DSL |
| **Skills** | `docs/skills/battle.md` |
| **Inputs** | FULL-SPEC §2, §3, §7.2–7.3, §8.2; formation prefs |
| **Outputs** | `battle/` (Go), golden replays |
| **Anti-overlap** | No Unity/web HUD, shop, or economy UI. One combat core for PvP+PvE (mode-layer only). |

### `client` — Unity client

| Field | Value |
|---|---|
| **Role** | Unity presenter / hub / battle HUD (mobile · web · Steam) |
| **Skills** | `docs/skills/client.md` |
| **Inputs** | FULL-SPEC §6, §9, §12 UI; §0 platforms |
| **Outputs** | `client/` Unity project |
| **Anti-overlap** | Soft-launch **browser** QA uses `web-hud`, not this role. No client-side damage SoT. |

### `web-hud` — thin browser HUD (soft-launch test)

| Field | Value |
|---|---|
| **Role** | Thin web HUD over `devapi` for Andrew’s manual browser test |
| **Skills** | `docs/skills/web-hud.md` · design-load → `docs/skills/hud-design-load.md` |
| **Inputs** | `client/web-hud/`; Stitch HTML/assets; `docs/nav-ia.md`; prefs (yard/trade layout) |
| **Outputs** | `client/web-hud/**` PR; smoke notes under `internal/` |
| **Anti-overlap** | Do **not** start HUD without Andrew’s explicit command. One HUD bring-up at a time. No Unity work. **Do not** change menu/submenu (`D-025`). Phone landscape CSS/gate = **MF-145** (`D-036`) — no duplicate CSS PR. Stitch **reimport** is `stitch` role; layout accept is `qa-ui`. |

### `backend` — Nakama + economy RPC

| Field | Value |
|---|---|
| **Role** | Auth, inventory, limits, IAP, jars/pity, pass, shared matchmaking |
| **Skills** | `docs/skills/backend.md` |
| **Inputs** | FULL-SPEC §5, §7.5, §8.1, §8.3, §4, §11 |
| **Outputs** | `backend/` |
| **Anti-overlap** | No battle resolution (call battle-service). No VFX/art. |

### `liveops` — versioned configs

| Field | Value |
|---|---|
| **Role** | JSON + schema + CI validate for live balance |
| **Skills** | `docs/skills/liveops.md` |
| **Inputs** | FULL-SPEC §7.4, §5, §14 |
| **Outputs** | `liveops/` |
| **Anti-overlap** | Content authors write card JSON via `content`; liveops owns schemas/changelog. |

### `content` — cards / parts / potions data

| Field | Value |
|---|---|
| **Role** | Card/part/potion JSON + RU/EN name_keys |
| **Skills** | `docs/skills/content.md` |
| **Inputs** | FULL-SPEC §2, §10, §7.2–7.3; class-variants / starter-pack docs |
| **Outputs** | `content/` |
| **Anti-overlap** | No balance number edits without LiveOps changelog line. No UI. |

### `qa` — acceptance (§13)

| Field | Value |
|---|---|
| **Role** | Gameplay acceptance vs FULL-SPEC §13 |
| **Skills** | `docs/skills/qa.md` |
| **Inputs** | §1, §13, §11; replay/seed |
| **Outputs** | Checklists / bug reports with battleId·seed·replay |
| **Anti-overlap** | No feature coding. UI pixel accept = `qa-ui`, not this role. |

### `qa-ui` — screen acceptance vs Stitch

| Field | Value |
|---|---|
| **Role** | Per-screen UI accept; mark voids; fix layout to etalon |
| **Skills** | `docs/skills/qa.md` + prefs UI/Stitch lines |
| **Inputs** | `media/` etalons; `docs/stitch-screen-inventory.md`; `docs/ui-acceptance-checklist.md` |
| **Outputs** | Layout PRs; screenshots under `media/qa-*`; notes in `internal/` |
| **Anti-overlap** | One screen (or one nav area) per worker. Do not parallel another yard/login/trade layout agent. |

---

## C. Design / docs / Stitch briefs (Project-era)

These dominate soft-launch work but were historically under-specified in `AGENTS.md` (fixed in-repo alongside this export).

### `design` — SSOT / locked design notes

| Field | Value |
|---|---|
| **Role** | Patch FULL-SPEC or locked design docs; no drive-by feature code |
| **Skills** | `docs/skills/design.md` |
| **Inputs** | FULL-SPEC target §§; related store/repo docs; `preferences.md` |
| **Outputs** | Spec/docs PR; optional Project `docs/<topic>.md` note |
| **Anti-overlap** | Player-facing wiki = `wiki` role. Combat numbers that change sim = also notify `battle`/`content`. |

### `wiki` — player-facing rules & economy wiki

| Field | Value |
|---|---|
| **Role** | Consolidate player-facing rules/economy into one wiki |
| **Skills** | `docs/skills/design.md` |
| **Inputs** | `docs/FULL-SPEC.md`; shops/armor/formation/class docs; prefs |
| **Outputs** | `docs/game-wiki.md` (repo + store copy if needed) |
| **Anti-overlap** | Do not fork a second “rules dump”. Wiki ≠ SSOT — combat disputes patch FULL-SPEC. |

### `stitch` — Stitch prompts & HTML import

| Field | Value |
|---|---|
| **Role** | Write Stitch prompts **or** import zip/share into web-hud |
| **Skills** | `docs/skills/stitch.md` |
| **Inputs** | `docs/stitch-*.md`; inventory; public share / Download All zip (private Google links fail) |
| **Outputs** | Prompt docs under `docs/`; imported assets under `client/web-hud/` |
| **Anti-overlap** | Prompt-author ≠ layout-fixer. One pack/topic per worker. No HUD restart unless Andrew asked. |

### `merge-ci` — merge ready PR after green CI

| Field | Value |
|---|---|
| **Role** | Merge open ready PR into `main` when CI green (prefs: merge immediately) |
| **Skills** | `docs/skills/merge-ci.md` |
| **Inputs** | PR URL; CI status |
| **Outputs** | Merged `main`; short confirmation |
| **Anti-overlap** | Do not re-edit the feature. One merge agent per PR. Feature author should not also be the long-lived merge owner unless coordinator assigns it. |

---

## D. Optional / phase-gated (do not spawn on soft launch)

| Role | When | Reads |
|---|---|---|
| `clan` | phase 5 | FULL-SPEC §4.4, §0 |
| `farm` | phase 6 | §4.4 farm/nursery |
| `art` | asset need | §2 readability, §6 |
| `marketing` | landing/stores | brief only — attach brand/seo skills then |

---

## E. Anti-overlap matrix (quick)

| Topic | Owner role | Do not also spawn |
|---|---|---|
| Battle rules / formation | `battle` (+ `design` for SSOT patch) | second combat “mechanics” chat |
| Card JSON | `content` | `liveops` writing cards |
| Economy channels / pass | `design` → then `backend`/`liveops` | parallel shop-docs writers |
| Stitch pack N | one `stitch` worker | another pack overlapping same screens |
| Web HUD up | one `web-hud` | Acceptance HUD + Soft launch HUD + Re-smoke in parallel |
| Design-load screen pack | one `web-hud` (+ `stitch` import only) | second worker on same route; menu/IA edits; MF-145 CSS |
| Phone landscape / rotate gate | **MF-145** only | parallel orientGate / portrait MQ PRs |
| Yard / trade layout | one `qa-ui` | Trade plaza + Yard side-actions + Screen review together |
| Merge PR #N | one `merge-ci` | second merge agent on same PR |
| Game wiki | one `wiki` | duplicate “rules dump” docs |

---

## F. Skills attach list

### Always OK for game work

`orchestrator`, `battle`, `client`, `web-hud`, `hud-design-load`, `backend`, `liveops`, `content`, `qa`, `design`, `stitch`, `merge-ci`

### Do **not** attach (unless marketing task)

User skills: `brand`, `page-copy`, `semantic-core`, `site-contract`, `social-posts`, `launch-checklist`, `weekly-growth`, `seo-audit`, `ponytail*`

---

## G. Cloud worker hygiene (operational)

- Prefer **archive** completed one-shots after merge (keep history; stop re-use).
- ERROR workers: list in audit; resume only if outcome still open.
- IDLE + done MF task → archive; do not kick “finish” follow-ups on a closed topic.
- Coordinator Project agent stays long-lived; workers are ephemeral.

---

## H. Brand / naming note for paste targets

- Project / prefs / wiki brand: **Мифиус: Мифические котики**
- Repo SSOT title still uses **Мифоус / Mythfel** in places — treat Mythfel as code name; player brand = Мифиус. Align SSOT naming only via an explicit `design` task.
