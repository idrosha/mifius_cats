import { useState } from "react";
import type { AccountSnapshotDto, ShopApiClient } from "@mir-games/adapters-web";
import type { StoragePort } from "@mir-games/platform-contracts";

type Props = {
  playerId: string;
  shopApi: ShopApiClient;
  storage: StoragePort;
  account: AccountSnapshotDto;
  onAccountChange: (next: AccountSnapshotDto) => void;
  onBack: () => void;
};

export function SettingsScreen({
  playerId,
  shopApi,
  storage,
  account,
  onAccountChange,
  onBack,
}: Props) {
  const [language, setLanguage] = useState(account.settings.language);
  const [soundEnabled, setSoundEnabled] = useState(account.settings.soundEnabled);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const next = await shopApi.updateSettings(playerId, { language, soundEnabled });
      onAccountChange(next);
      // UI cache via StoragePort — not source of truth.
      await storage.set("settings-cache", next.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="screen settings-screen">
      <button type="button" className="link-back" onClick={onBack}>
        ← Меню
      </button>
      <header className="brand-header">
        <p className="brand">Мир Квизов</p>
        <h1>Настройки</h1>
      </header>

      {error ? <p className="error-banner">{error}</p> : null}

      <label className="field">
        <span>Язык</span>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={busy}
        >
          <option value="ru">Русский</option>
          <option value="en">English</option>
        </select>
      </label>

      <label className="field checkbox-field">
        <input
          type="checkbox"
          checked={soundEnabled}
          onChange={(e) => setSoundEnabled(e.target.checked)}
          disabled={busy}
        />
        <span>Звук</span>
      </label>

      <button type="button" className="btn-primary" disabled={busy} onClick={() => void save()}>
        Сохранить
      </button>
    </section>
  );
}
