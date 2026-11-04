import type { BotServerPorts } from "./types.js";

/** Temporary stubs until game-core + real adapters are wired. */
export function createStubPorts(): BotServerPorts {
  return {
    auth: {
      async verifyPlayer() {
        return null;
      },
    },
    payment: {
      async confirmReceipt() {
        return { ok: false };
      },
    },
    storage: {
      async getPlayerState() {
        return null;
      },
      async savePlayerState() {},
    },
    leaderboard: {
      async getTop() {
        return [];
      },
    },
    clock: {
      now: () => new Date(),
    },
    random: {
      next: () => Math.random(),
    },
  };
}
