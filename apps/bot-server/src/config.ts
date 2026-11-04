/**
 * Env-based config. Secrets come only from the process environment.
 * Never hardcode TELEGRAM_BOT_TOKEN or other credentials here.
 */
export type BotConfig = {
  /** Present only when the Telegram bot process should start. */
  telegramBotToken: string | null;
  httpPort: number;
  corsOrigin: string;
  /** Public HTTPS URL of the Mini App (optional deep-link hint in /single). */
  miniappUrl: string | null;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): BotConfig {
  const telegramBotToken = env.TELEGRAM_BOT_TOKEN?.trim() || null;
  const httpPort = Number(env.HTTP_PORT ?? "8787");
  const corsOrigin = env.CORS_ORIGIN?.trim() || "*";
  const miniappUrl = env.MINIAPP_URL?.trim() || null;

  if (!Number.isFinite(httpPort) || httpPort <= 0) {
    throw new Error("HTTP_PORT must be a positive number");
  }

  return { telegramBotToken, httpPort, corsOrigin, miniappUrl };
}
