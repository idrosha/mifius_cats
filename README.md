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

## Локальный запуск (Phase 5 demo)

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

### 2) Web

В другом терминале:

```bash
export VITE_API_BASE_URL=http://127.0.0.1:8787
npm run web:dev
# открыть http://127.0.0.1:5174
```

Демо-потоки:

- **Сингл:** Меню → Одиночная игра → Египет → 30 вопросов → результат (аватар с экипировкой виден на карте / в игре / результате).
- **Магазин:** Меню → Магазин → купить косметику за очки или stub-деньги → «надеть» → аватар обновляется. Секция «Только за чемпионат» заблокирована до Phase 7. Купить «Повторная попытка уровня» — кредит появляется в аккаунте.
- **Аккаунт:** Меню → Аккаунт → статистика, правка имени, счётчик вторых попыток.
- **Настройки:** язык + звук (сервер + локальный StoragePort-кэш).

Auth — локальный demo id (`demo:web-demo`) через `/api/auth/verify`. Стартовый stub-баланс денег позволяет покупать без реальных платежей; очки копятся с прохождений.

### 3) Mini App

```bash
export VITE_API_BASE_URL=http://127.0.0.1:8787
npm run miniapp:dev
# открыть http://127.0.0.1:5173
```

Тот же магазин / аккаунт / аватар, что и на web.

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
