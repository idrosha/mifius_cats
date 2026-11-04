import { useEffect, useState } from "react";
import type { OnlineApiClient, OnlineMatchPublicDto } from "@mir-games/adapters-web";
import type { AvatarLoadout } from "@mir-games/game-core";
import { AvatarView } from "../components/AvatarView";

type Props = {
  playerId: string;
  avatar: AvatarLoadout;
  onlineApi: OnlineApiClient;
  onMatched: (match: OnlineMatchPublicDto) => void;
  onBack: () => void;
};

export function OnlineLobbyScreen({
  playerId,
  avatar,
  onlineApi,
  onMatched,
  onBack,
}: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void onlineApi
      .getRating(playerId)
      .then(setRating)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      });
  }, [onlineApi, playerId]);

  async function findMatch(): Promise<void> {
    setBusy(true);
    setError(null);
    setStatus("Поиск соперника…");
    try {
      // MVP default: instant stub opponent. Structure also supports queue-human.
      const result = await onlineApi.queue(playerId, "stub-bot");
      if (result.status === "matched" && result.match) {
        setStatus("Матч найден");
        onMatched(result.match);
        return;
      }
      setStatus("В очереди — ждём второго игрока");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="screen online-lobby">
      <header className="brand-header online-lobby-header">
        <p className="brand">Мир Квизов</p>
        <h1>Онлайн</h1>
        <p className="subtitle">
          Три раунда: выбор · несколько верных · свободный текст. Очки считает сервер.
        </p>
      </header>

      <div className="online-lobby-avatars">
        <AvatarView loadout={avatar} size="md" label="Вы" />
      </div>

      <p className="online-rating">
        Рейтинг: <strong>{rating ?? "…"}</strong>
      </p>

      {status ? <p className="online-status">{status}</p> : null}
      {error ? <p className="error-banner">{error}</p> : null}

      <div className="actions">
        <button type="button" className="btn" disabled={busy} onClick={() => void findMatch()}>
          {busy ? "Ищем…" : "Найти матч"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Назад
        </button>
      </div>
    </section>
  );
}
