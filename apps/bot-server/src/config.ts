import {
  DEFAULT_OPEN_DAYS_OF_MONTH,
  normalizeOpenDays,
} from "@mir-games/game-core";

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
  /**
   * Championship open days of month (1–31). Stub override via CHAMPIONSHIP_OPEN_DAYS
   * (comma-separated, or `*` for all days). No secrets.
   */
  championshipOpenDays: number[];
};

function parseOpenDays(raw: string | undefined): number[] {
  const trimmed = raw?.trim();
  if (!trimmed || trimmed === "*") {
    return [...DEFAULT_OPEN_DAYS_OF_MONTH];
  }
  const parts = trimmed.split(/[,:\s]+/).filter(Boolean);
  return normalizeOpenDays(parts.map((p) => Number(p)));
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): BotConfig {
  const telegramBotToken = env.TELEGRAM_BOT_TOKEN?.trim() || null;
  const httpPort = Number(env.HTTP_PORT ?? "8787");
  const corsOrigin = env.CORS_ORIGIN?.trim() || "*";
  const miniappUrl = env.MINIAPP_URL?.trim() || null;
  const championshipOpenDays = parseOpenDays(env.CHAMPIONSHIP_OPEN_DAYS);

  if (!Number.isFinite(httpPort) || httpPort <= 0) {
    throw new Error("HTTP_PORT must be a positive number");
  }

  return { telegramBotToken, httpPort, corsOrigin, miniappUrl, championshipOpenDays };
}
