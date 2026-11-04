import { ANSWER_TIME_MS } from "@mir-games/game-core";

type Props = {
  remainingMs: number;
};

function timerTone(ratio: number): "ok" | "mid" | "low" {
  if (ratio > 0.45) return "ok";
  if (ratio > 0.2) return "mid";
  return "low";
}

export function TimerBar({ remainingMs }: Props) {
  const ratio = Math.max(0, Math.min(1, remainingMs / ANSWER_TIME_MS));
  const seconds = (remainingMs / 1000).toFixed(1);
  const tone = timerTone(ratio);

  return (
    <div className={`timer timer-${tone}`} role="timer" aria-live="polite" aria-valuenow={Number(seconds)} aria-valuemin={0} aria-valuemax={ANSWER_TIME_MS / 1000}>
      <div className="timer-track">
        <div className="timer-fill" style={{ transform: `scaleX(${ratio})` }} />
        <span className="timer-label">{seconds}с</span>
      </div>
    </div>
  );
}
