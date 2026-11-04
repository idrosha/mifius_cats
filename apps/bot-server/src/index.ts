import { loadConfig } from "./config.js";
import { createBot, registerBotCommands } from "./bot.js";
import { createStubPorts } from "./ports/stubs.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const ports = createStubPorts();
  const bot = createBot({ token: config.telegramBotToken, ports });

  await registerBotCommands(bot);

  console.log("Мир Квизов bot-server starting (long polling)…");
  await bot.start({
    onStart: () => {
      console.log("Bot is running. Token is read from TELEGRAM_BOT_TOKEN only.");
    },
  });
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("Fatal:", message);
  process.exit(1);
});
