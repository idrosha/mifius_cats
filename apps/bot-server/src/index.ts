import { loadConfig } from "./config.js";
import { createBot, registerBotCommands } from "./bot.js";
import { createStubPorts } from "./ports/stubs.js";
import { createInMemoryProgressStore } from "./progress/store.js";
import { createInMemoryMatchStore } from "./online/match-store.js";
import { startHttpApi } from "./api/http.js";
import { setMiniappUrl } from "./handlers/menu.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const ports = createStubPorts();
  const store = createInMemoryProgressStore();
  const matches = createInMemoryMatchStore({ progress: store });

  setMiniappUrl(config.miniappUrl);

  await startHttpApi({
    port: config.httpPort,
    store,
    matches,
    corsOrigin: config.corsOrigin,
  });

  if (!config.telegramBotToken) {
    console.log(
      "TELEGRAM_BOT_TOKEN not set — HTTP API only (browser demo). Set the token in env to also start the bot.",
    );
    return;
  }

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
