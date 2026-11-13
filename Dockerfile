# Amvera / local — Mythfel web-hud only (no quiz, no battle sidecar).
# Flat /app: server.mjs + public/. Platforms that still call `npm start` must get
# "node server.mjs" (see package.json), never "node client/web-hud/server.mjs".
FROM node:20-bookworm-slim

WORKDIR /app

COPY client/web-hud/server.mjs ./server.mjs
COPY client/web-hud/public ./public
COPY content/i18n ./content/i18n
COPY liveops/config ./liveops/config

# package.json start matches /app layout (Amvera log showed npm start of nested path).
RUN printf '%s\n' \
  '{' \
  '  "name": "mythfel-web-hud",' \
  '  "private": true,' \
  '  "type": "module",' \
  '  "scripts": { "start": "node server.mjs" },' \
  '  "engines": { "node": ">=20" }' \
  '}' > package.json

ENV NODE_ENV=production
ENV HUD_ADDR=0.0.0.0
ENV PORT=5000

EXPOSE 5000

# Same as amvera.yaml run.command / run.args
CMD ["node", "server.mjs"]
