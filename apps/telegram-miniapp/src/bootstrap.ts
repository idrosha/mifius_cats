import {
  createProgressApiClient,
  createTelegramAdapters,
} from "@mir-games/adapters-telegram";
import { createGameCore, type GameCoreEngine } from "@mir-games/game-core";
import type { AuthPort, PlayerIdentity } from "@mir-games/platform-contracts";
import type { ProgressApiClient } from "@mir-games/adapters-telegram";

export type AppBootstrap = {
  apiBaseUrl: string;
  engine: GameCoreEngine;
  auth: AuthPort;
  progressApi: ProgressApiClient;
  player: PlayerIdentity;
};

function resolveApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv.replace(/\/$/, "");
  }
  return "http://127.0.0.1:8787";
}

export async function bootstrapApp(): Promise<AppBootstrap> {
  const apiBaseUrl = resolveApiBaseUrl();
  const adapters = createTelegramAdapters({
    apiBaseUrl,
    demoPlayerId: "local-demo",
    analyticsDebug: Boolean(import.meta.env.DEV),
  });

  const webApp = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;
  webApp?.ready();
  webApp?.expand();

  const player = await adapters.auth.getSession();
  if (!player) {
    throw new Error("Не удалось авторизоваться (initData / demo)");
  }

  const progressApi = createProgressApiClient(apiBaseUrl);
  const snapshot = await progressApi.load(player.playerId);

  const engine = createGameCore(adapters.gameCorePorts);
  engine.setProgress(snapshot.progress);
  engine.setAvatar(snapshot.avatar);

  adapters.gameCorePorts.analytics?.identify(player.playerId, {
    displayName: player.displayName ?? null,
  });

  return {
    apiBaseUrl,
    engine,
    auth: adapters.auth,
    progressApi,
    player,
  };
}
