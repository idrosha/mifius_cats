# Мифиус / Mythfel (`mifius_cats`)

Cat battle game soft launch: Двор + PvP. Brand (player-facing): **Мифиус: Мифические котики**. Code/repo name: Mythfel.

SSOT: [`docs/FULL-SPEC.md`](./docs/FULL-SPEC.md). Launch pack: [`ЗАПУСК.md`](./ЗАПУСК.md). Agents: [`AGENTS.md`](./AGENTS.md) → [`docs/AGENTS.md`](./docs/AGENTS.md).

## Layout

```
battle/                 # Go battle sim / golden / devapi
backend/                # Nakama / economy stubs
liveops/                # CDN stub + soft-launch geo
client/
  web-hud/              # Browser HUD (no Unity required)
  …                     # Presenter / LocalSmoke (.NET)
content/                # cats, cards, parts, stages, campaign, i18n
docs/                   # FULL-SPEC, game-wiki, skills
qa/                     # soft-launch / acceptance / web-hud harness
.github/workflows/      # mythfel-soft-launch.yml
```

No quiz monorepo. Secrets stay in env / CI only — never commit `.env` with real values.

## Local smoke

Needs Go 1.22+ and Node 20+.

```bash
./qa/run-web-hud.sh
# → http://127.0.0.1:8088/
```

Or by service (see `ЗАПУСК.md` §3):

| Service | Command |
|---|---|
| LiveOps CDN stub | `cd liveops && go run ./cmd/cdn-stub -geo soft-launch/geo_allowlist.example.json` → `:8090` |
| battle/devapi | `cd battle && go run ./cmd/devapi -content ../content` → `:8081` |
| Web HUD | `cd client/web-hud && node server.mjs` → `:8088` |
| Soft-launch gate | `./qa/run-soft-launch.sh` |
| §13 acceptance | `./qa/run-acceptance.sh` |

Optional port overrides: copy [`.env.example`](./.env.example). Web HUD notes: `client/web-hud/README.md`. Device checklist: `qa/DEVICE_SMOKE.md`.

## Docs

- Player wiki: [`docs/game-wiki.md`](./docs/game-wiki.md)
- Doc index: [`docs/README.md`](./docs/README.md)
