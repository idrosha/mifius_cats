import {
  applyLevelResult,
  createEmptyProgress,
  isBlockUnlocked,
  isLevelUnlocked,
  type AvatarLoadout,
  type LevelRunResult,
  type SinglePlayerProgress,
} from "@mir-games/game-core";

export type PlayerSave = {
  playerId: string;
  displayName?: string;
  progress: SinglePlayerProgress;
  avatar: AvatarLoadout;
  /** Cumulative points from committed runs (spendable later in shop). */
  totalPoints: number;
  updatedAtMs: number;
};

export type ProgressStore = {
  getOrCreate(playerId: string, displayName?: string): PlayerSave;
  commitRun(playerId: string, result: LevelRunResult): PlayerSave;
  setAvatar(playerId: string, avatar: AvatarLoadout): PlayerSave;
  snapshot(playerId: string): {
    progress: SinglePlayerProgress;
    avatar: AvatarLoadout;
    totalPoints: number;
  };
};

const DEFAULT_AVATAR: AvatarLoadout = {
  equipped: {
    shirt: "starter-shirt",
    pants: "starter-pants",
    shoes: "starter-shoes",
  },
};

/** In-memory server store — source of truth for Phase 3 progress / block gate. */
export function createInMemoryProgressStore(nowMs: () => number = () => Date.now()): ProgressStore {
  const byPlayer = new Map<string, PlayerSave>();

  function getOrCreate(playerId: string, displayName?: string): PlayerSave {
    const existing = byPlayer.get(playerId);
    if (existing) {
      if (displayName && !existing.displayName) {
        existing.displayName = displayName;
      }
      return existing;
    }
    const created: PlayerSave = {
      playerId,
      displayName,
      progress: createEmptyProgress(),
      avatar: { equipped: { ...DEFAULT_AVATAR.equipped } },
      totalPoints: 0,
      updatedAtMs: nowMs(),
    };
    byPlayer.set(playerId, created);
    return created;
  }

  return {
    getOrCreate,
    commitRun(playerId, result) {
      const save = getOrCreate(playerId);

      if (!isLevelUnlocked(save.progress, result.levelIndex)) {
        throw new Error(`Level ${result.levelIndex} is locked for player ${playerId}`);
      }

      const prevAttempts = save.progress.levels[result.levelIndex]?.attemptCount ?? 0;
      if (prevAttempts >= 1) {
        // Paid retries land in Phase 5 — reject second free attempt for now.
        throw new Error(
          `Level ${result.levelIndex} already completed; buy a retry in the shop (Phase 5)`,
        );
      }

      save.progress = applyLevelResult(save.progress, result.levelIndex, result.score);
      save.totalPoints += result.score;
      save.updatedAtMs = nowMs();

      // Touch block unlock evaluation so callers can rely on gating helpers.
      void isBlockUnlocked(save.progress, 0);

      return save;
    },
    setAvatar(playerId, avatar) {
      const save = getOrCreate(playerId);
      save.avatar = avatar;
      save.updatedAtMs = nowMs();
      return save;
    },
    snapshot(playerId) {
      const save = getOrCreate(playerId);
      return {
        progress: save.progress,
        avatar: save.avatar,
        totalPoints: save.totalPoints,
      };
    },
  };
}
