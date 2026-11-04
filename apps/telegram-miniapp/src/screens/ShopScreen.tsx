import { useEffect, useMemo, useState } from "react";
import type { ShopApiClient, AccountSnapshotDto, ShopItem } from "@mir-games/adapters-telegram";
import type { PaymentPort } from "@mir-games/platform-contracts";
import { AvatarView } from "../components/AvatarView";

const CATEGORY_LABELS: Record<string, string> = {
  hats: "Шляпы",
  glasses: "Очки",
  shirts: "Рубашки",
  sweaters: "Кофты",
  accessories: "Аксессуары",
  pants: "Штаны",
  shoes: "Обувь",
};

type Props = {
  playerId: string;
  shopApi: ShopApiClient;
  payment: PaymentPort;
  account: AccountSnapshotDto;
  onAccountChange: (next: AccountSnapshotDto) => void;
  onBack: () => void;
};

export function ShopScreen({
  playerId,
  shopApi,
  payment,
  account,
  onAccountChange,
  onBack,
}: Props) {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [category, setCategory] = useState<string>("hats");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void shopApi.catalog(playerId).then((catalog) => {
      setItems(catalog.items);
    });
  }, [playerId, shopApi]);

  const standardCosmetics = useMemo(
    () =>
      items.filter(
        (i) => i.kind === "cosmetic" && i.section === "standard" && i.category === category,
      ),
    [items, category],
  );
  const retries = useMemo(() => items.filter((i) => i.kind === "level_retry"), [items]);
  const championship = useMemo(
    () => items.filter((i) => i.section === "championship"),
    [items],
  );

  async function buyPoints(itemId: string): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const next = await shopApi.buy(playerId, itemId, "points");
      onAccountChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function buyMoney(itemId: string): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      // Money path goes through PaymentPort stub → server receipt validation.
      const result = await payment.purchase(itemId);
      if (!result.ok) {
        throw new Error(result.reason ?? "Payment failed");
      }
      const next = await shopApi.account(playerId);
      onAccountChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function equip(itemId: string): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const next = await shopApi.equip(playerId, itemId);
      onAccountChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="screen shop-screen">
      <button type="button" className="link-back" onClick={onBack}>
        ← Меню
      </button>
      <header className="brand-header">
        <p className="brand">Мир Квизов</p>
        <h1>Магазин</h1>
        <p className="subtitle">
          Очки: {account.totalPoints} · Деньги (stub): {account.moneyBalance} · Попытки:{" "}
          {account.retryCredits}
        </p>
      </header>

      <AvatarView loadout={account.avatar} size="lg" label="Экипировка" />

      {error ? <p className="error-banner">{error}</p> : null}

      <div className="category-tabs" role="tablist" aria-label="Категории">
        {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={category === id}
            className={`category-tab ${category === id ? "is-active" : ""}`}
            onClick={() => setCategory(id)}
            disabled={busy}
          >
            {label}
          </button>
        ))}
      </div>

      <ul className="shop-list">
        {standardCosmetics.map((item) => {
          const owned = account.ownedItemIds.includes(item.id);
          const equipped = Object.values(account.avatar.equipped).includes(item.id);
          return (
            <li key={item.id} className="shop-row">
              <div>
                <strong>{item.title}</strong>
                <p className="shop-meta">
                  {item.pricePoints ?? "—"} очк. / {item.priceMoney ?? "—"} ден.
                </p>
              </div>
              <div className="shop-actions">
                {owned ? (
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={busy || equipped}
                    onClick={() => void equip(item.id)}
                  >
                    {equipped ? "надето" : "надеть"}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={busy || item.pricePoints === undefined}
                      onClick={() => void buyPoints(item.id)}
                    >
                      за очки
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={busy || item.priceMoney === undefined}
                      onClick={() => void buyMoney(item.id)}
                    >
                      за деньги
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <h2 className="section-title">Повторная попытка</h2>
      <ul className="shop-list">
        {retries.map((item) => (
          <li key={item.id} className="shop-row">
            <div>
              <strong>{item.title}</strong>
              <p className="shop-meta">
                {item.pricePoints} очк. / {item.priceMoney} ден. · на складе: {account.retryCredits}
              </p>
            </div>
            <div className="shop-actions">
              <button
                type="button"
                className="btn-secondary"
                disabled={busy}
                onClick={() => void buyPoints(item.id)}
              >
                за очки
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={busy}
                onClick={() => void buyMoney(item.id)}
              >
                за деньги
              </button>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="section-title">Только за чемпионат</h2>
      <div className={`champ-lock ${account.championshipParticipated ? "is-open" : ""}`}>
        {!account.championshipParticipated ? (
          <p className="champ-lock-msg">
            Секция заблокирована. Разблокировка — участием в чемпионате (Phase 7). Купить за очки
            или деньги нельзя.
          </p>
        ) : null}
        <ul className="shop-list">
          {championship.map((item) => (
            <li key={item.id} className="shop-row is-locked">
              <div>
                <strong>{item.title}</strong>
                <p className="shop-meta">чемпионат</p>
              </div>
              <span className="badge">{account.championshipParticipated ? "открыто" : "лок"}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
