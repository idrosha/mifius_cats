import type { GameCorePorts } from "@mir-games/game-core";
import type { AuthPort, LifecyclePort } from "@mir-games/platform-contracts";
import { createWebAnalytics } from "./analytics.js";
import { createWebAuth, type WebAuthOptions } from "./auth.js";
import { createWebClock } from "./clock.js";
import { createWebHaptics } from "./haptics.js";
import { createWebLifecycle } from "./lifecycle.js";
import { createWebRandom } from "./random.js";
import { createWebStorage } from "./storage.js";

export type WebAdapterBundle = {
  gameCorePorts: GameCorePorts;
  auth: AuthPort;
  lifecycle: LifecyclePort;
};

export type CreateWebAdaptersOptions = {
  apiBaseUrl: string;
  analyticsDebug?: boolean;
  defaultPlayerId?: string;
  defaultDisplayName?: string;
  storagePrefix?: string;
};

/** Wire browser adapters for game-core + auth (no Telegram SDK). */
export function createWebAdapters(
  options: CreateWebAdaptersOptions,
): WebAdapterBundle {
  const clock = createWebClock();
  const random = createWebRandom();
  const storage = createWebStorage(options.storagePrefix);
  const analytics = createWebAnalytics(options.analyticsDebug ?? false);
  const haptics = createWebHaptics();
  const authOptions: WebAuthOptions = {
    apiBaseUrl: options.apiBaseUrl,
    storage,
    defaultPlayerId: options.defaultPlayerId,
    defaultDisplayName: options.defaultDisplayName,
  };
  const auth = createWebAuth(authOptions);
  const lifecycle = createWebLifecycle();

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
