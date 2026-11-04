import type { AvatarLoadout, SinglePlayerProgress } from "@mir-games/game-core";
import { isLevelUnlocked } from "@mir-games/game-core";
import { AvatarView } from "../components/AvatarView";
import { MAP_LOCATIONS } from "../content/egypt-level";

type Props = {
  progress: SinglePlayerProgress;
  avatar: AvatarLoadout;
  totalPoints: number;
  onBack: () => void;
  onPlayLevel: (levelIndex: number) => void;
};

export function MapScreen({ progress, avatar, totalPoints, onBack, onPlayLevel }: Props) {
  return (
    <section className="screen map-screen">
      <header className="map-header">
        <button type="button" className="link-back" onClick={onBack}>
          ← Меню
        </button>
        <div className="map-header-row">
          <div>
            <p className="brand">Мир Квизов</p>
            <h1>Карта уровней</h1>
            <p className="subtitle">Очки: {totalPoints}</p>
          </div>
          <AvatarView loadout={avatar} size="md" />
        </div>
      </header>

      <div className="map-plane" aria-label="Тематическая карта">
        {MAP_LOCATIONS.map((loc) => {
          const unlocked = isLevelUnlocked(progress, loc.levelIndex);
          const record = progress.levels[loc.levelIndex];
          const done = record?.completed === true;
          return (
            <article key={loc.levelIndex} className={`map-location ${loc.artClass} ${unlocked ? "is-open" : "is-locked"}`}>
              <div className="map-location-art" aria-hidden="true" />
              <div className="map-location-body">
                <h2>
                  {loc.levelIndex}. {loc.title}
                </h2>
                <p>{loc.blurb}</p>
                {done ? (
                  <p className="map-score">
                    Лучший результат: {record.bestScore} · попыток: {record.attemptCount}
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
          );
        })}
      </div>
    </section>
  );
}
