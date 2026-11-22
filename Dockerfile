# Amvera: web-hud + battle/devapi in one image (training needs CreatePvE).
# Docs: https://docs.amvera.ru/applications/configuration/docker.html
# Alpine keeps Amvera build RAM lower (trial OOM → edge 502/503/404).
FROM golang:1.22-alpine AS battle
WORKDIR /src
COPY battle/ ./
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /mythfel-devapi ./cmd/devapi

FROM node:20-alpine
WORKDIR /app

COPY --from=battle /mythfel-devapi /usr/local/bin/mythfel-devapi
COPY client/web-hud/server.mjs ./server.mjs
COPY client/web-hud/dungeon-dev-api.mjs ./dungeon-dev-api.mjs
COPY client/web-hud/public ./public
COPY client/web-hud/amvera-start.sh ./amvera-start.sh
COPY content ./content
COPY liveops/config ./liveops/config

RUN printf '%s\n' \
  '{' \
  '  "name": "mythfel-web-hud",' \
  '  "private": true,' \
  '  "type": "module",' \
  '  "scripts": { "start": "node server.mjs" },' \
  '  "engines": { "node": ">=20" }' \
  '}' > package.json \
  && chmod +x /app/amvera-start.sh

ENV NODE_ENV=production
ENV HUD_ADDR=0.0.0.0
ENV PORT=5000
ENV BATTLE_URL=http://127.0.0.1:8081
ENV BATTLE_CONTENT=/app/content

EXPOSE 5000

CMD ["/app/amvera-start.sh"]
