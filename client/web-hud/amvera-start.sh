#!/bin/sh
# Start battle/devapi (loopback) then HUD. Training/PvE proxy to BATTLE_URL.
set -eu
CONTENT="${BATTLE_CONTENT:-/app/content}"
mythfel-devapi -addr 127.0.0.1:8081 -content "$CONTENT" &
exec node /app/server.mjs
