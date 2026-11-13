# Amvera / local — Mythfel web-hud only (no quiz, no battle sidecar).
# Official Amvera Node apps listen on PORT + 0.0.0.0; we mirror that here.
FROM node:20-bookworm-slim

WORKDIR /app

# Flat /app layout: same as a small Amvera Node repo (script at root + public/).
COPY client/web-hud/package.json client/web-hud/server.mjs ./
COPY client/web-hud/public ./public
COPY content/i18n ./content/i18n
COPY liveops/config ./liveops/config

ENV NODE_ENV=production
ENV HUD_ADDR=0.0.0.0
ENV PORT=5000

EXPOSE 5000

CMD ["node", "server.mjs"]
