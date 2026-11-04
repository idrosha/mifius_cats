import type { GameCorePorts } from "@mir-games/game-core";
import type { AuthPort } from "@mir-games/platform-contracts";
import { createTelegramAnalytics } from "./analytics.js";
import { createTelegramAuth, type TelegramAuthOptions } from "./auth.js";
import { createTelegramClock } from "./clock.js";
import { createTelegramHaptics } from "./haptics.js";
import { createTelegramLifecycle } from "./lifecycle.js";
import { createTelegramRandom } from "./random.js";
import { createTelegramStorage } from "./storage.js";
import type { LifecyclePort } from "@mir-games/platform-contracts";

export type TelegramAdapterBundle = {
  gameCorePorts: GameCorePorts;
  auth: AuthPort;
  lifecycle: LifecyclePort;
};

export type CreateTelegramAdaptersOptions = TelegramAuthOptions & {
  analyticsDebug?: boolean;
};

/** Wire Telegram / browser adapters for game-core + auth. */
export function createTelegramAdapters(
  options: CreateTelegramAdaptersOptions,
): TelegramAdapterBundle {
  const clock = createTelegramClock();
  const random = createTelegramRandom();
  const storage = createTelegramStorage();
  const analytics = createTelegramAnalytics(options.analyticsDebug ?? false);
  const haptics = createTelegramHaptics();
  const auth = createTelegramAuth(options);
  const lifecycle = createTelegramLifecycle();

  return {
    gameCorePorts: {
      clock,
      random,
      storage,
      analytics,
      haptics,
    },
    auth,
    lifecycle,
  };
}
