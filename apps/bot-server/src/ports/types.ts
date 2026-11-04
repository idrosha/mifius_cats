/**
 * Platform ports the game-core will talk to later.
 * Bot-server confirms untrusted-client economy (saves, initData, receipts, retries, championship fee).
 * Keep adapters here; no DOM / Telegram SDK leakage into packages/game-core.
 */

export type AuthPort = {
  /** Verify Telegram initData / identity for a player session. */
  verifyPlayer(initData: string): Promise<{ playerId: string } | null>;
};

export type PaymentPort = {
  confirmReceipt(payload: unknown): Promise<{ ok: boolean }>;
};

export type StoragePort = {
  getPlayerState(playerId: string): Promise<unknown | null>;
  savePlayerState(playerId: string, state: unknown): Promise<void>;
};

export type LeaderboardPort = {
  getTop(limit: number): Promise<Array<{ playerId: string; score: number }>>;
};

export type ClockPort = {
  now(): Date;
};

export type RandomPort = {
  next(): number;
};

/** Placeholder registry — wire real adapters when game-core lands. */
export type BotServerPorts = {
  auth: AuthPort;
  payment: PaymentPort;
  storage: StoragePort;
  leaderboard: LeaderboardPort;
  clock: ClockPort;
  random: RandomPort;
};
