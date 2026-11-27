# Mythfel / Мифиус — MVP Beta Release Notes, TG Pin & Packaging Plan

**SSOT:** `docs/FULL-SPEC.md` §1.1 · `D-066` · `D-067`  
**Branch:** `cursor/mvp-beta-dad5` · **Flag:** `feature_flags.mvp_beta = true`

---

## 1. Текст закрепа для Telegram-канала (RU)

```markdown
🐾 **МИФИУС: МИФИЧЕСКИЕ КОТИКИ — СТАРТ MVP BETA!**

Добро пожаловать в первую бету **Мифиус / Mythfel** — карточных пошаговых боёв 3 на 3 с общим кросс-плеем между **Telegram Mini App, Web, Android и iOS**!

🔥 **Что уже доступно в MVP Beta:**
• Обучение + стартовый отряд из 3 котиков (честные равные колоды)
• Тренировка 3v3 и PvE-кампания Мифмира (30 узлов)
• PvP Колизей: Рейтинг (сезоны 28 дней + призы), Свободный бой и Дружеские дуэли по ссылке
• Прокачка котиков R1–R8, пресеты команд, боевые зелья (≤1 каждого вида)
• Ежедневные задания, реплеи последних 10 боёв, общий чат и друзья
• Магазин котиков и Боевой пропуск (4 PvE / 10 PvP в день, ×2 опыта котикам, в финале — случайный котик)
• Без рекламы, без shop-гачи, без P2W в рейтинге

🚀 **Что войдёт в Большое обновление (Этап 2 / Full):**
• 🌾 Ферма и автоферма для владельцев пропуска
• 🧬 Питомник и скрещивание обычных котиков в мифических
• 🏰 Гильдии и Клан-босс (кооперативные бои и рейтинг гильдий)
• ⚔️ Кооп-данжи и Рейды на 12 героев
• 🍺 Таверна, Рынок ресурсов и Аукцион игроков
• 🏺 Лавки с банками и расширенный Кодекс
• 💻 Steam / PC-версия

📩 **Совет:** привяжите email в Настройках — ваш аккаунт и прогресс будут общими в Telegram, браузере и на телефоне.
```

---

## 2. Telegram Channel Pin Copy (EN)

```markdown
🐾 **MYTHFEL — MVP BETA IS LIVE!**

Welcome to the first beta slice of **Mythfel**, a 3v3 turn-based cat card battler with unified cross-play across **Telegram Mini App, Web, Android, and iOS**!

🔥 **Live in MVP Beta:**
• Tutorial + 3 starter cats (equal decks, fair PvP)
• 3v3 Practice + Mythmir PvE campaign (30 nodes)
• PvP Arena: Ranked (28-day seasons + prizes), Unranked, and Friendly Duel invite links
• Cat progression R1–R8, 3v3 squad presets, battle potions (≤1 per type)
• Daily quests, last 10 battle replays, friends & global chat
• Direct Cat Shop + Battle Pass (4 PvE / 10 PvP daily, 2× cat rank XP, 1 server-RNG random cat on pass completion)
• Zero ads, zero shop gacha jars, anti-P2W ranked ladder

🚀 **Coming in the Full Update (Stage 2):**
• Farm & Pass autofarm · Mythic Nursery / Breeding · Guilds & Clan Boss · Co-op Dungeons & 12-Hero Raids · Tavern, Market & Player Auction · Extended Codex · Steam/PC build

📩 **Tip:** Link your email in Settings to sync your account across Telegram, Web, Android, and iOS.
```

---

## 3. План дистрибуции и упаковки клиентов (без store SDK в SSOT)

Все клиенты подключаются к **одному** backend / battle-service и **одному** кросс-плей пулу матчмейкинга (сегментации по платформе нет, `FULL-SPEC §0, §8.1`). Бой, награды, лимиты (3/5 free · 4/10 pass) и финал пасса — строго server-side.

| Клиент | Сборка / канал | Вход и синхронизация | Платежи (`yarn` / Pass) |
|---|---|---|---|
| **Web** | `client/web-hud` (Docker / Amvera HTTPS) с `MVP_BETA=1` | Device / логин + привязка Email | Web checkout / sandbox (отдельная задача провайдера) |
| **Telegram Bot + Mini App** | `telegram-bot.mjs` (`BOT_TOKEN` + `WEB_APP_URL`) + `telegram-auth.mjs` (`initData` HMAC-SHA256) | Авто-логин `tg_<id>` + привязка Email; deep-link `/start duel_<code>` → `?duel=<code>` | Telegram Stars (подключается отдельной задачей вне SSOT) |
| **Android APK (телефоны + планшеты)** | Единый клиент (Unity URP 2D §9 или Capacitor WebView-обёртка поверх `WEB_APP_URL`) с `applicationId = com.mythfel.game`, portrait + landscape адаптив (`D-065`), minSdk 24, targetSdk 35, signed APK/AAB | Device ID + Email link (общий аккаунт с TG/Web) | Google Play Billing (отдельная задача интеграции; server receipt verify) |
| **iOS (TestFlight / App Store)** | Тот же проект (`bundleId = com.mythfel.game`), universal iPhone + iPad, ATS HTTPS к общему backend, архив Xcode → TestFlight beta | Sign in / Device + Email link (общий аккаунт) | StoreKit / App Store IAP (отдельная задача; server receipt verify) |

### Чеклист сборки Android APK / iOS TestFlight (следующий шаг после Web/TG smoke)
1. Зафиксировать prod HTTPS endpoint backend + battle-service + LiveOps CDN (`feature_flags.mvp_beta = true`).
2. Проверить portrait (телефоны 360–430px) и landscape (планшеты 768–1280px) без обрезания CTA и чата (`D-065`).
3. Подключить канальные IAP-адаптеры (Play Billing / App Store / TG Stars) через серверную валидацию чеков (`backend/internal/economy/iap.go`), не добавляя store-специфичные API в `docs/FULL-SPEC.md`.
4. Прогнать кросс-плей матч: Telegram Mini App vs Web vs Android APK vs iOS TestFlight в одном пуле MM.
