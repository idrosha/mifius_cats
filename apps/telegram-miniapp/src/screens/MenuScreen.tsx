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
  onSelect: (id: string) => void;
};

export function MenuScreen({ displayName, onSelect }: Props) {
  return (
    <section className="screen menu-screen">
      <header className="brand-header">
        <p className="brand">Мир Квизов</p>
        <h1>Меню</h1>
        {displayName ? <p className="subtitle">Привет, {displayName}</p> : null}
      </header>
      <nav className="menu-list" aria-label="Главное меню">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`menu-item ${item.stub ? "is-stub" : "is-primary"}`}
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
