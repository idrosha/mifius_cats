# Мир Квизов (`mir_games`)

Кроссплатформенные познавательные квизы: одно игровое ядро, платформы только в адаптерах. Клиенты — Telegram-бот + Mini App + Web.

## Структура (monorepo)

```
apps/
  bot-server/              # Telegram bot + HTTP API (прогресс, auth stub)
  telegram-miniapp/        # Telegram Mini App (Vite + React)
  web/                     # Browser web client (Vite + React)
packages/
  platform-contracts/      # порты (TypeScript interfaces)
  game-core/               # правила квиза без DOM / Telegram
  adapters-telegram/       # адаптеры портов для Mini App
  adapters-web/            # адаптеры портов для браузера
```

Секреты (токен бота, GitHub secrets) хранятся **только в окружении / секретах CI**. Не коммитьте `.env` и не вставляйте реальные токены в код, README или историю git.

## Локальный запуск (Phase 4 demo)

Требования: Node.js 20+.

```bash
npm install
cp .env.example .env
# при желании: TELEGRAM_BOT_TOKEN=... (без токена поднимется только HTTP API)
```

### 1) HTTP API + опционально бот

```bash
npm run bot:dev
# API: http://127.0.0.1:8787/health
```

Без `TELEGRAM_BOT_TOKEN` процесс работает в режиме API-only (удобно для браузерного демо).

### 2) Web (Phase 4)

В другом терминале:

```bash
export VITE_API_BASE_URL=http://127.0.0.1:8787
npm run web:dev
# открыть http://127.0.0.1:5174
```

Демо-поток: **Меню → Одиночная игра → Египет → 30 вопросов (10 с) → результат**. Аватар виден на карте, в игре и на экране результата. Auth — локальный demo id (`demo:web-demo`) через тот же `/api/auth/verify` (пока §9 web-auth открыт).

### 3) Mini App (Phase 3)

```bash
export VITE_API_BASE_URL=http://127.0.0.1:8787
npm run miniapp:dev
# открыть http://127.0.0.1:5173
```

### Проверки

```bash
npm run typecheck
npm test
```

## Безопасность

- Переменные: `TELEGRAM_BOT_TOKEN`, `HTTP_PORT`, `CORS_ORIGIN`, `MINIAPP_URL`, `VITE_API_BASE_URL`
- Пример без значений: `.env.example`
- `.env` в `.gitignore` — не коммитить
- В клиенте секретов нет; initData HMAC-проверка — следующий шаг после стабильного токена в env сервера
