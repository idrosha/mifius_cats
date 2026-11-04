import type { AvatarLoadout } from "@mir-games/game-core";
import { AvatarView } from "../components/AvatarView";

type MenuItem = {
  id: string;
  title: string;
  stub?: boolean;
};

const ITEMS: MenuItem[] = [
  { id: "single", title: "Одиночная игра" },
  { id: "online", title: "Онлайн" },
  { id: "championship", title: "Чемпионат" },
  { id: "leaders", title: "Лидеры", stub: true },
  { id: "shop", title: "Магазин" },
  { id: "account", title: "Аккаунт" },
  { id: "settings", title: "Настройки" },
];

type Props = {
  displayName?: string;
  avatar: AvatarLoadout;
  onSelect: (id: string) => void;
  onAvatar?: () => void;
};

export function MenuScreen({ displayName, avatar, onSelect, onAvatar }: Props) {
  return (
    <section className="screen menu-screen">
      <div className="travel-atmosphere" aria-hidden="true" />
      <header className="brand-header menu-hero">
        <h1 className="brand-hero">Мир Квизов</h1>
        <p className="subtitle">
          {displayName ? `Привет, ${displayName}. Мягкое путешествие по знаниям.` : "Мягкое путешествие по знаниям."}
        </p>
      </header>

      <button
        type="button"
        className="menu-avatar-tile"
        onClick={() => (onAvatar ? onAvatar() : onSelect("account"))}
        aria-label="Персонаж"
      >
        <AvatarView loadout={avatar} size="lg" label="Путешественник" />
        <span className="menu-avatar-cta">Персонаж · косметика</span>
      </button>

      <nav className="menu-list" aria-label="Главное меню">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`menu-item ${item.stub ? "is-stub" : item.id === "single" ? "is-primary" : ""}`}
            onClick={() => onSelect(item.id)}
          >
            <span>{item.title}</span>
            {item.stub ? (
              <span className="badge">скоро</span>
            ) : (
              <span className="badge go">{item.id === "single" ? "играть" : "открыть"}</span>
            )}
          </button>
        ))}
      </nav>
    </section>
  );
}
