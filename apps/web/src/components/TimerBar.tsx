import { ANSWER_TIME_MS } from "@mir-games/game-core";

type Props = {
  remainingMs: number;
};

export function TimerBar({ remainingMs }: Props) {
  const ratio = Math.max(0, Math.min(1, remainingMs / ANSWER_TIME_MS));
  const seconds = (remainingMs / 1000).toFixed(1);
  const urgent = remainingMs <= 3000;

  return (
    <div className={`timer ${urgent ? "timer-urgent" : ""}`} role="timer" aria-live="polite">
      <div className="timer-track">
        <div className="timer-fill" style={{ transform: `scaleX(${ratio})` }} />
      </div>
      <span className="timer-label">{seconds}с</span>
    </div>
  );
}
