import type { AvatarLoadout, SinglePlayerProgress } from "@mir-games/game-core";
import {
  BLOCK_SCORE_GATE,
  BLOCK_SIZE,
  blockIndexForLevel,
  isLevelUnlocked,
  levelsInBlock,
  sumBlockScore,
} from "@mir-games/game-core";
import { AvatarView } from "../components/AvatarView";
import { MAP_LOCATIONS } from "@mir-games/question-bank";

type Props = {
  progress: SinglePlayerProgress;
  avatar: AvatarLoadout;
  totalPoints: number;
  onBack: () => void;
  onPlayLevel: (levelIndex: number) => void;
  onAvatar?: () => void;
};

/** Active block: first with an incomplete level, else last available block in map. */
function resolveBlockIndex(progress: SinglePlayerProgress): number {
  const maxIndex = Math.max(...MAP_LOCATIONS.map((l) => l.levelIndex), 1);
  const maxBlock = blockIndexForLevel(maxIndex);
  for (let b = 0; b <= maxBlock; b += 1) {
    const { start, end } = levelsInBlock(b);
    for (let i = start; i <= end; i += 1) {
      if (!progress.levels[i]?.completed) {
        return b;
      }
    }
  }
  return maxBlock;
}

export function MapScreen({ progress, avatar, totalPoints, onBack, onPlayLevel, onAvatar }: Props) {
  const blockIndex = resolveBlockIndex(progress);
  const { start, end } = levelsInBlock(blockIndex);
  const blockLocations = MAP_LOCATIONS.filter((loc) => loc.levelIndex >= start && loc.levelIndex <= end);
  const blockScore = sumBlockScore(progress, blockIndex);
  const gateRatio = Math.max(0, Math.min(1, blockScore / BLOCK_SCORE_GATE));
  const blockTitle = blockIndex === 0 ? "Города и страны" : `Блок ${blockIndex + 1}`;

  return (
    <section className="screen map-screen">
      <div className="travel-atmosphere" aria-hidden="true" />
      <header className="map-header">
        <button type="button" className="link-back" onClick={onBack}>
          ← Меню
        </button>
        <div className="map-header-row">
          <div>
            <p className="brand-kicker">Мир Квизов</p>
            <h1 className="map-title">{blockTitle}</h1>
            <p className="subtitle">
              Уровни {start}–{end} · очки: {totalPoints}
            </p>
          </div>
          <button type="button" className="avatar-chip-btn" onClick={onAvatar} aria-label="Аватар">
            <AvatarView loadout={avatar} size="sm" />
          </button>
        </div>
      </header>

      <div className="points-bar" role="meter" aria-valuenow={blockScore} aria-valuemin={0} aria-valuemax={BLOCK_SCORE_GATE} aria-label="Очки блока">
        <div className="points-bar-track">
          <div className="points-bar-fill" style={{ width: `${gateRatio * 100}%` }} />
          <span className="points-bar-label">
            Блок: {blockScore} / {BLOCK_SCORE_GATE} к следующему десятку
          </span>
        </div>
      </div>

      <div className="map-path-scroll" aria-label={`Горизонтальный путь из ${BLOCK_SIZE} уровней`}>
        <ol className="map-path">
          {blockLocations.map((loc, i) => {
            const unlocked = isLevelUnlocked(progress, loc.levelIndex);
            const record = progress.levels[loc.levelIndex];
            const done = record?.completed === true;
            const current = unlocked && !done;
            return (
              <li key={loc.levelIndex} className="map-path-item">
                {i > 0 ? <span className={`map-chain ${unlocked || done ? "is-open" : "is-locked"}`} aria-hidden="true" /> : null}
                <article
                  className={`map-node ${loc.artClass} ${unlocked ? "is-open" : "is-locked"} ${done ? "is-done" : ""} ${current ? "is-current" : ""}`}
                >
                  <div className="map-node-art" aria-hidden="true" />
                  {!unlocked ? <span className="map-lock" aria-hidden="true"><span className="map-lock-shackle" /><span className="map-lock-body" /></span> : null}
                  <div className="map-node-body">
                    <p className="map-node-index">{loc.levelIndex}</p>
                    <h2>{loc.title}</h2>
                    <p className="map-node-blurb">{loc.blurb}</p>
                    {done ? (
                      <p className="map-score">
                        Лучший: {record.bestScore}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      className="btn"
                      disabled={!unlocked || done}
                      onClick={() => onPlayLevel(loc.levelIndex)}
                    >
                      {!unlocked ? "Закрыто" : done ? "Пройдено" : "Играть"}
                    </button>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
