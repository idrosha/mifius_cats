export {
  ANSWER_TIME_MS,
  BLOCK_SCORE_GATE,
  BLOCK_SIZE,
  POINTS_PER_CORRECT,
  QUESTIONS_PER_LEVEL,
} from "./constants.js";

export {
  applyLevelResult,
  blockIndexForLevel,
  createEmptyProgress,
  getLevelRecord,
  isBlockCompleted,
  isBlockUnlocked,
  isLevelUnlocked,
  levelsInBlock,
  sumBlockScore,
} from "./gating.js";

export { countCorrect, gradeAnswer, sumScore } from "./scoring.js";

export { LevelSession } from "./session.js";
export type { LevelSessionState, SubmitResult } from "./session.js";

export { createGameCore } from "./engine.js";
export type { GameCoreEngine } from "./engine.js";

export type { GameCorePorts } from "./ports.js";

export type {
  AvatarLoadout,
  ChoiceOption,
  Difficulty,
  EquipmentItem,
  EquipmentSlot,
  GradedAnswer,
  KnowledgeDomain,
  LevelDefinition,
  LevelRecord,
  LevelRunResult,
  MultiChoiceQuestion,
  PlayerAnswer,
  Question,
  QuestionFormat,
  SingleChoiceQuestion,
  SinglePlayerProgress,
  TextQuestion,
} from "./types.js";

export {
  CATEGORY_TO_SLOT,
  COSMETIC_CATEGORIES,
  SLOT_TO_CATEGORY,
  STARTER_ITEM_IDS,
  STARTER_MONEY_BALANCE,
  equipOwnedItem,
  findShopItem,
  getShopCatalog,
  prepareRetryForCommit,
  purchaseShopItem,
  unequipSlot,
  unlockChampionshipCosmetics,
} from "./shop.js";
export type {
  CosmeticCategory,
  EconomyMutationResult,
  PlayerEconomy,
  ShopCurrency,
  ShopItem,
  ShopProductKind,
  ShopSection,
} from "./shop.js";
