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
  locationArtClass?: string;
  onFinished: (result: LevelRunResult) => void;
};

function questionKey(q: Question | null, index: number): string {
  return q ? `${q.id}:${index}` : `done:${index}`;
}

export function PlayScreen({ session, avatar, locationTitle, locationArtClass = "loc-egypt", onFinished }: Props) {
  const [, tick] = useReducer((n: number) => n + 1, 0);
  const [multiPick, setMultiPick] = useState<string[]>([]);
  const [singlePick, setSinglePick] = useState<string | null>(null);
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
        setSinglePick(null);
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
    setSinglePick(null);
  }, [state.questionIndex]);

  function submitAnswer(answer: PlayerAnswer): void {
    const result = session.submit(answer);
    setMultiPick([]);
    setSinglePick(null);
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
      <header className="play-top">
        <p className="brand-kicker">Мир Квизов</p>
        <p className="play-meta">
          {locationTitle} · вопрос {state.questionIndex + 1}/30
        </p>
        <TimerBar remainingMs={remainingMs} />
      </header>

      <div className={`play-zone-image ${locationArtClass}`}>
        <div className="play-zone-image-art" aria-hidden="true" />
        <div className="play-zone-image-body">
          <p className="domain">
            {question.domain} · {question.difficulty}
          </p>
          <h1 className="prompt">{question.prompt}</h1>
        </div>
      </div>

      <div className="play-zone-bottom">
        <aside className="play-zone-avatar">
          <AvatarView loadout={avatar} size="lg" label="Вы" />
        </aside>
        <div className="play-zone-answers">
          {question.format === "single_choice" ? (
            <SingleChoice
              question={question}
              selected={singlePick}
              onPick={setSinglePick}
              onSubmit={() => {
                if (singlePick) {
                  submitAnswer({ format: "single_choice", optionId: singlePick });
                }
              }}
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
      </div>
    </section>
  );
}

function SingleChoice({
  question,
  selected,
  onPick,
  onSubmit,
}: {
  question: SingleChoiceQuestion;
  selected: string | null;
  onPick: (optionId: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="options options-list" role="listbox" aria-label="Варианты">
      {question.options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={`option ${selected === opt.id ? "is-selected" : ""}`}
          aria-selected={selected === opt.id}
          onClick={() => onPick(opt.id)}
        >
          {opt.label}
        </button>
      ))}
      <button type="button" className="btn btn-submit" disabled={!selected} onClick={onSubmit}>
        Ответить
      </button>
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
    <div className="options options-list multi">
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
      <button type="button" className="btn btn-submit" disabled={selected.length === 0} onClick={onSubmit}>
        Ответить
      </button>
    </div>
  );
}
