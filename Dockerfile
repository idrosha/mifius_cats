# Amvera Docker deploy — Mythfel web-hud ONLY (no monorepo in /app).
# Docs: https://docs.amvera.ru/applications/configuration/docker.html
# Image CMD is plain `node server.mjs` — never `npm start`.
FROM node:20-bookworm-slim

WORKDIR /app

COPY client/web-hud/server.mjs ./server.mjs
COPY client/web-hud/public ./public
COPY content/i18n ./content/i18n
COPY liveops/config ./liveops/config

# Tiny package.json only so accidental `npm start` still runs the same file.
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
# Amvera sets PORT from run.containerPort; keep default in sync with amvera.yaml.
ENV PORT=5000

EXPOSE 5000

CMD ["node", "server.mjs"]
