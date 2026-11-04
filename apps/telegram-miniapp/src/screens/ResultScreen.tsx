import type { AvatarLoadout, LevelRunResult } from "@mir-games/game-core";
import { AvatarView } from "../components/AvatarView";

type Props = {
  result: LevelRunResult;
  avatar: AvatarLoadout;
  commitError?: string | null;
  onMap: () => void;
  onMenu: () => void;
};

export function ResultScreen({ result, avatar, commitError, onMap, onMenu }: Props) {
  const wrong = result.totalQuestions - result.correctCount;
  return (
    <section className="screen result-screen">
      <div className="travel-atmosphere" aria-hidden="true" />
      <header className="result-header">
        <p className="brand-kicker">Мир Квизов</p>
        <h1>Уровень пройден</h1>
        <AvatarView loadout={avatar} size="lg" label="Путешественник" />
      </header>
      <dl className="result-stats">
        <div>
          <dt>Верных</dt>
          <dd className="ok">
            {result.correctCount}/{result.totalQuestions}
          </dd>
        </div>
        <div>
          <dt>Ошибки</dt>
          <dd className="error">{wrong}</dd>
        </div>
        <div>
          <dt>Очки</dt>
          <dd>{result.score}</dd>
        </div>
      </dl>
      {commitError ? <p className="error">{commitError}</p> : <p className="ok">Прогресс сохранён на сервере</p>}
      <div className="result-actions">
        <button type="button" className="btn" onClick={onMap}>
          На карту
        </button>
        <button type="button" className="btn btn-ghost" onClick={onMenu}>
          В меню
        </button>
      </div>
    </section>
  );
}
