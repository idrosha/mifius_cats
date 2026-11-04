/**
 * Env-based config. Secrets come only from the process environment.
 * Never hardcode TELEGRAM_BOT_TOKEN or other credentials here.
 */
export type BotConfig = {
  telegramBotToken: string;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): BotConfig {
  const telegramBotToken = env.TELEGRAM_BOT_TOKEN?.trim();

  if (!telegramBotToken) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN is missing. Set it in the environment or a local .env file (see .env.example). Do not put the token in source or commits.",
    );
  }

  return { telegramBotToken };
}
