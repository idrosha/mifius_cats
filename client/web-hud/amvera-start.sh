#!/bin/sh
# Start battle/devapi (loopback) then HUD. Never block HUD on battle spawn errors —
# Amvera edge 502/503/404 when the Node process never binds :PORT.
set -u
CONTENT="${BATTLE_CONTENT:-/app/content}"
if command -v mythfel-devapi >/dev/null 2>&1; then
  mythfel-devapi -addr 127.0.0.1:8081 -content "$CONTENT" &
else
  echo "amvera-start: mythfel-devapi missing — HUD-only mode" >&2
fi
exec node /app/server.mjs
