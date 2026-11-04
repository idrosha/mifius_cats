import { useCallback, useEffect, useState } from "react";
import type {
  ChampionshipApiClient,
  ChampionshipRunDto,
  ChampionshipStatusDto,
} from "@mir-games/adapters-web";
import { CHAMPIONSHIP_ENTRY_PRODUCT_ID } from "@mir-games/game-core";
import type { PaymentPort } from "@mir-games/platform-contracts";
import { AvatarView } from "../components/AvatarView";

type Props = {
  playerId: string;
  championshipApi: ChampionshipApiClient;
  payment: PaymentPort;
  onStarted: (run: ChampionshipRunDto) => void;
  onAccountRefresh: () => void;
  onBack: () => void;
};

export function ChampionshipLobbyScreen({
  playerId,
  championshipApi,
  payment,
  onStarted,
  onAccountRefresh,
  onBack,
}: Props) {
  const [status, setStatus] = useState<ChampionshipStatusDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const next = await championshipApi.status(playerId);
    setStatus(next);
  }, [championshipApi, playerId]);

  useEffect(() => {
    void refresh().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : String(err));
    });
  }, [refresh]);

  async function enter(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      // PaymentPort stub (web money / Stars stub) → server receipt validation.
      const paid = await payment.purchase(CHAMPIONSHIP_ENTRY_PRODUCT_ID);
      if (!paid.ok) {
        throw new Error(paid.reason ?? "Payment failed");
      }
      await refresh();
      onAccountRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function startRun(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const run = await championshipApi.start(playerId);
      onStarted(run);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function settle(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const next = await championshipApi.settle(playerId);
      setStatus(next);
      onAccountRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (!status) {
    return (
      <section className="screen">
        <p>Загрузка чемпионата…</p>
        {error ? <p className="error-banner">{error}</p> : null}
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Назад
        </button>
      </section>
    );
  }

  const sharePct = Math.round(status.prizePoolShare * 100);

  return (
    <section className="screen championship-lobby">
      <header className="brand-header">
        <p className="brand">Мир Квизов</p>
        <h1>Чемпионат</h1>
        <p className="subtitle">
          Период {status.periodKey} ·{" "}
          {status.open ? "открыт для входа" : "вход сегодня закрыт"} · фонд stub
        </p>
      </header>

      <div className="championship-avatar-row">
        <AvatarView loadout={status.you.avatar} size="lg" label="Ваш аватар" />
      </div>

      <dl className="championship-stats">
        <div>
          <dt>Взнос</dt>
          <dd>{status.entryFeeMoney} ден. (stub)</dd>
        </div>
        <div>
          <dt>В фонд</dt>
          <dd>{sharePct}% взноса</dd>
        </div>
        <div>
          <dt>Призовой фонд</dt>
          <dd>{status.prizePool}</dd>
        </div>
        <div>
          <dt>Баланс</dt>
          <dd>{status.you.moneyBalance}</dd>
        </div>
      </dl>

      <p className="championship-days">
        Дни месяца (UTC): {status.openDaysOfMonth.slice(0, 8).join(", ")}
        {status.openDaysOfMonth.length > 8 ? "…" : ""}
      </p>

      {status.you.entered ? (
        <p className="online-status">
          Вы в чемпионате · счёт {status.you.score}
          {status.you.runFinished ? " · забег завершён" : ""}
          {status.you.championshipParticipated ? " · секция магазина открыта" : ""}
        </p>
      ) : (
        <p className="online-status">Участие платное — часть взноса идёт в призовой фонд.</p>
      )}

      {status.periodStatus === "settled" ? (
        <p className="online-status">
          Итог: победитель {status.winnerPlayerId ?? "—"}, выплата stub{" "}
          {status.winnerPayout ?? 0}
        </p>
      ) : null}

      {error ? <p className="error-banner">{error}</p> : null}

      <ul className="championship-board">
        {status.leaderboard.length === 0 ? (
          <li>Пока нет участников</li>
        ) : (
          status.leaderboard.map((row, i) => (
            <li key={row.playerId}>
              #{i + 1} {row.displayName ?? row.playerId}: {row.score}
              {row.runFinished ? "" : " (в игре)"}
            </li>
          ))
        )}
      </ul>

      <div className="actions">
        {!status.you.entered ? (
          <button
            type="button"
            className="btn"
            disabled={busy || !status.open}
            onClick={() => void enter()}
          >
            {busy ? "Оплата…" : `Вступить за ${status.entryFeeMoney}`}
          </button>
        ) : null}
        {status.you.entered && !status.you.runFinished ? (
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => void startRun()}
          >
            {status.you.runActive ? "Продолжить" : "Играть"}
          </button>
        ) : null}
        {status.periodStatus !== "settled" && status.leaderboard.some((r) => r.runFinished) ? (
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy}
            onClick={() => void settle()}
          >
            Определить победителя (stub)
          </button>
        ) : null}
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Назад
        </button>
      </div>
    </section>
  );
}
