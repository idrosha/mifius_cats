# Мир Квизов (`mir_games`)

Кроссплатформенные познавательные квизы: одно игровое ядро, платформы только в адаптерах. Первая реализация — общий Telegram-бот (`apps/bot-server`).

## Структура (monorepo)

```
apps/
  bot-server/     # Telegram bot-server (grammY), подтверждение экономики и порты
packages/         # позже: game-core и общие пакеты
```

Секреты (токен бота, GitHub secrets) хранятся **только в окружении / секретах CI**. Не коммитьте `.env` и не вставляйте реальные токены в код, README или историю git.

## Локальный запуск bot-server

Требования: Node.js 20+.

1. Установите зависимости из корня репозитория:

```bash
npm install
```

2. Задайте токен бота (из [@BotFather](https://t.me/BotFather)) **только через окружение**:

```bash
cp .env.example .env
# отредактируйте .env: TELEGRAM_BOT_TOKEN=<ваш токен>
export TELEGRAM_BOT_TOKEN="$(grep -E '^TELEGRAM_BOT_TOKEN=' .env | cut -d= -f2-)"
```

Или одной командой без файла:

```bash
export TELEGRAM_BOT_TOKEN="your-token-from-botfather"
```

3. Режим разработки (tsx watch):

```bash
npm run bot:dev
```

Или сборка + запуск:

```bash
npm run bot:build
npm run bot
```

Команды бота: `/start`, `/single`, `/online`, `/championship`, `/leaders`, `/shop`, `/account`, `/settings`. Пока разделы меню отвечают «скоро» — это заглушки под game-core.

## Безопасность

- Переменная окружения: `TELEGRAM_BOT_TOKEN`
- Пример без значения: `.env.example`
- `.env` в `.gitignore` — не коммитить
- В GitHub Actions / хостинге кладите токен в **Secrets**, не в репозиторий
