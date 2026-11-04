import { useState } from "react";
import type { AccountSnapshotDto, ShopApiClient } from "@mir-games/adapters-telegram";
import { AvatarView } from "../components/AvatarView";

type Props = {
  playerId: string;
  shopApi: ShopApiClient;
  account: AccountSnapshotDto;
  onAccountChange: (next: AccountSnapshotDto) => void;
  onDisplayNameChange: (name: string) => void;
  onBack: () => void;
};

export function AccountScreen({
  playerId,
  shopApi,
  account,
  onAccountChange,
  onDisplayNameChange,
  onBack,
}: Props) {
  const [nameDraft, setNameDraft] = useState(account.displayName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function saveProfile(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const next = await shopApi.updateProfile(playerId, nameDraft);
      onAccountChange(next);
      if (next.displayName) {
        onDisplayNameChange(next.displayName);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="screen account-screen">
      <button type="button" className="link-back" onClick={onBack}>
        ← Меню
      </button>
      <header className="brand-header">
        <p className="brand">Мир Квизов</p>
        <h1>Аккаунт</h1>
        <p className="subtitle">{account.playerId}</p>
      </header>

      <AvatarView loadout={account.avatar} size="lg" label={account.displayName ?? "Игрок"} />

      {error ? <p className="error-banner">{error}</p> : null}

      <h2 className="section-title">Профиль</h2>
      <label className="field">
        <span>Имя</span>
        <input
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          maxLength={40}
          disabled={busy}
        />
      </label>
      <button type="button" className="btn-primary" disabled={busy} onClick={() => void saveProfile()}>
        Сохранить
      </button>

      <h2 className="section-title">Статистика</h2>
      <dl className="stats-grid">
        <div>
          <dt>Пройдено уровней</dt>
          <dd>{account.stats.levelsCompleted}</dd>
        </div>
        <div>
          <dt>Всего попыток</dt>
          <dd>{account.stats.totalAttempts}</dd>
        </div>
        <div>
          <dt>Сумма лучших очков</dt>
          <dd>{account.stats.bestScoreSum}</dd>
        </div>
        <div>
          <dt>Вторые попытки</dt>
          <dd>{account.secondAttemptCount}</dd>
        </div>
        <div>
          <dt>Очки</dt>
          <dd>{account.totalPoints}</dd>
        </div>
        <div>
          <dt>Попытки на складе</dt>
          <dd>{account.retryCredits}</dd>
        </div>
        <div>
          <dt>Онлайн-рейтинг</dt>
          <dd>{account.onlineRating ?? "—"}</dd>
        </div>
      </dl>
    </section>
  );
}
