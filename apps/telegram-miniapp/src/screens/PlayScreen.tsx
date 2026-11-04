import { useEffect, useReducer, useState } from "react";
import type {
  AvatarLoadout,
  LevelRunResult,
  LevelSession,
  MultiChoiceQuestion,
  PlayerAnswer,
  Question,
  SingleChoiceQuestion,
} from "@mir-games/game-core";
import { AvatarView } from "../components/AvatarView";
import { TimerBar } from "../components/TimerBar";

type Props = {
  session: LevelSession;
  avatar: AvatarLoadout;
  locationTitle: string;
  onFinished: (result: LevelRunResult) => void;
};

function questionKey(q: Question | null, index: number): string {
  return q ? `${q.id}:${index}` : `done:${index}`;
}

export function PlayScreen({ session, avatar, locationTitle, onFinished }: Props) {
  const [, tick] = useReducer((n: number) => n + 1, 0);
  const [multiPick, setMultiPick] = useState<string[]>([]);
  const state = session.getState();
  const question = session.currentQuestion();
  const remainingMs = session.remainingMs();

  useEffect(() => {
    const id = window.setInterval(() => {
      if (session.getState().finished) {
        return;
      }
      tick();
      if (session.isTimedOut()) {
        const submit = session.submit(null);
        setMultiPick([]);
        tick();
        if (submit.ok && submit.finished && submit.result) {
          onFinished(submit.result);
        }
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [session, onFinished]);

  useEffect(() => {
    setMultiPick([]);
  }, [state.questionIndex]);

  function submitAnswer(answer: PlayerAnswer): void {
    const result = session.submit(answer);
    setMultiPick([]);
    tick();
    if (result.ok && result.finished && result.result) {
      onFinished(result.result);
    }
  }

  if (!question || state.finished) {
    return (
      <section className="screen play-screen">
        <p>Завершение раунда…</p>
      </section>
    );
  }

  return (
    <section className="screen play-screen" key={questionKey(question, state.questionIndex)}>
      <header className="play-hud">
        <div className="play-hud-text">
          <p className="brand">Мир Квизов</p>
          <p className="play-meta">
            {locationTitle} · вопрос {state.questionIndex + 1}/30
          </p>
          <TimerBar remainingMs={remainingMs} />
        </div>
        <AvatarView loadout={avatar} size="sm" />
      </header>

      <div className="question-panel">
        <p className="domain">
          {question.domain} · {question.difficulty}
        </p>
        <h1 className="prompt">{question.prompt}</h1>
        {question.format === "single_choice" ? (
          <SingleChoice
            question={question}
            onPick={(optionId) => submitAnswer({ format: "single_choice", optionId })}
          />
        ) : null}
        {question.format === "multi_choice" ? (
          <MultiChoice
            question={question}
            selected={multiPick}
            onToggle={(id) =>
              setMultiPick((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
              )
            }
            onSubmit={() => submitAnswer({ format: "multi_choice", optionIds: [...multiPick] })}
          />
        ) : null}
      </div>
    </section>
  );
}

function SingleChoice({
  question,
  onPick,
}: {
  question: SingleChoiceQuestion;
  onPick: (optionId: string) => void;
}) {
  return (
    <div className="options" role="listbox" aria-label="Варианты">
      {question.options.map((opt) => (
        <button key={opt.id} type="button" className="option" onClick={() => onPick(opt.id)}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function MultiChoice({
  question,
  selected,
  onToggle,
  onSubmit,
}: {
  question: MultiChoiceQuestion;
  selected: string[];
  onToggle: (id: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="options multi">
      <p className="hint">Может быть несколько верных ответов</p>
      {question.options.map((opt) => {
        const on = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            className={`option ${on ? "is-selected" : ""}`}
            aria-pressed={on}
            onClick={() => onToggle(opt.id)}
          >
            {opt.label}
          </button>
        );
      })}
      <button type="button" className="btn" disabled={selected.length === 0} onClick={onSubmit}>
        Ответить
      </button>
    </div>
  );
}
