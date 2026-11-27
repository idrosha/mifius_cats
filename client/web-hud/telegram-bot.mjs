/**
 * Minimal Telegram bot for the Mythfel Mini App. No dependencies (Node 20 fetch).
 * Long polling (no public webhook needed). Any message → reply with a button
 * that opens WEB_APP_URL inside Telegram.
 *   BOT_TOKEN    — token from @BotFather (secret, env only)
 *   WEB_APP_URL  — public HTTPS URL of the HUD (Amvera), e.g. https://xxx.amvera.io/
 */

const API_BASE = "https://api.telegram.org";
const BUTTON_TEXT = "⚔ Играть";
const WELCOME =
  "Мифиус: Мифические котики (MVP Beta).\nНажми «Играть» — игра откроется прямо здесь, в Telegram.\nКоманды: /start · /news";

const NEWS_PIN =
  "🐾 МИФИУС — MVP BETA!\n" +
  "Кросс-плей 3v3: Telegram · Web · Android · iOS.\n" +
  "Сейчас в бете: обучение, тренировка, PvE (30 узлов), PvP (Рейтинг / Свободный / Дружеская дуэль), пасс (4 PvE / 10 PvP + финальный котик), дейлики, сезоны 28д, реплеи ≤10.\n" +
  "В Большом обновлении (Этап 2): Ферма, Питомник, Гильдии/Клан-босс, Данжи/Рейды, Таверна/Рынок/Аукцион, Steam.";

async function callApi(token, method, payload = {}) {
  const res = await fetch(`${API_BASE}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!json.ok) {
    throw new Error(`${method}: ${json.description || `HTTP ${res.status}`}`);
  }
  return json.result;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function playKeyboard(webAppUrl, label = BUTTON_TEXT) {
  return { inline_keyboard: [[{ text: label, web_app: { url: webAppUrl } }]] };
}

function duelUrlFor(webAppUrl, code) {
  const u = new URL(webAppUrl);
  u.searchParams.set("duel", code);
  return u.toString();
}

async function handleMessage(token, webAppUrl, message) {
  if (!message?.chat?.id) return;
  const text = String(message.text || "").trim();
  if (/^\/news\b/i.test(text)) {
    const newsUrl = new URL("/news", webAppUrl).toString();
    await callApi(token, "sendMessage", {
      chat_id: message.chat.id,
      text: NEWS_PIN,
      reply_markup: playKeyboard(newsUrl, "📰 Открыть Новости"),
    });
    return;
  }
  const duelMatch = /^\/start\s+duel_([A-Za-z0-9]{4,16})/i.exec(text);
  if (duelMatch) {
    const code = duelMatch[1].toUpperCase();
    await callApi(token, "sendMessage", {
      chat_id: message.chat.id,
      text: `⚔ Приглашение в дружескую дуэль 3v3 (код ${code}). Нажми кнопку ниже, чтобы принять вызов!`,
      reply_markup: playKeyboard(duelUrlFor(webAppUrl, code), `⚔ Принять дуэль ${code}`),
    });
    return;
  }
  await callApi(token, "sendMessage", {
    chat_id: message.chat.id,
    text: WELCOME,
    reply_markup: playKeyboard(webAppUrl),
  });
}

/**
 * Starts polling. Resolves after getMe/setup succeed; polling continues in background.
 * @returns {Promise<{ username?: string } | null>} bot info, or null if not started
 */
export async function startTelegramBot({ token, webAppUrl, log = console }) {
  if (!token) return null;
  if (!/^https:\/\//i.test(webAppUrl || "")) {
    log.error("telegram-bot: WEB_APP_URL must be an https:// URL — bot not started");
    return null;
  }

  const me = await callApi(token, "getMe");
  // Polling and webhooks conflict; drop any leftover webhook from a previous deploy.
  await callApi(token, "deleteWebhook", { drop_pending_updates: false });
  await callApi(token, "setChatMenuButton", {
    menu_button: { type: "web_app", text: "Играть", web_app: { url: webAppUrl } },
  }).catch((err) => log.warn?.(`telegram-bot: menu button not set: ${err.message}`));

  let offset = 0;
  const loop = async () => {
    for (;;) {
      try {
        const updates = await callApi(token, "getUpdates", {
          offset,
          timeout: 25,
          allowed_updates: ["message"],
        });
        for (const update of updates) {
          offset = update.update_id + 1;
          await handleMessage(token, webAppUrl, update.message).catch((err) =>
            log.warn?.(`telegram-bot: reply failed: ${err.message}`),
          );
        }
      } catch (err) {
        log.warn?.(`telegram-bot: poll error: ${err.message}`);
        await sleep(3000);
      }
    }
  };
  loop();

  log.log?.(`telegram-bot: @${me.username} polling, Mini App → ${webAppUrl}`);
  return me;
}
