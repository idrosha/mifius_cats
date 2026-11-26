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
  "Мифиус: Мифические котики.\nНажми «Играть» — игра откроется прямо здесь, в Telegram.";

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

function playKeyboard(webAppUrl) {
  return { inline_keyboard: [[{ text: BUTTON_TEXT, web_app: { url: webAppUrl } }]] };
}

async function handleMessage(token, webAppUrl, message) {
  if (!message?.chat?.id) return;
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
