import type { AvatarLoadout } from "@mir-games/game-core";

type Props = {
  loadout: AvatarLoadout;
  /** Compact chip for play HUD vs larger on map. */
  size?: "sm" | "md" | "lg";
  label?: string;
};

/**
 * Always-visible player avatar (product rule 2026-11-04).
 * Cosmetics are represented as slot chips until art assets land.
 */
export function AvatarView({ loadout, size = "md", label = "Вы" }: Props) {
  const slots = Object.entries(loadout.equipped);
  return (
    <div className={`avatar avatar-${size}`} aria-label={`Аватар: ${label}`}>
      <div className="avatar-figure" aria-hidden="true">
        <div className="avatar-head" />
        <div className="avatar-torso" data-shirt={loadout.equipped.shirt ?? ""} />
        <div className="avatar-legs" data-pants={loadout.equipped.pants ?? ""} />
        <div className="avatar-feet" data-shoes={loadout.equipped.shoes ?? ""} />
        {loadout.equipped.hat ? <div className="avatar-hat" /> : null}
        {loadout.equipped.glasses ? <div className="avatar-glasses" /> : null}
      </div>
      <div className="avatar-meta">
        <span className="avatar-label">{label}</span>
        <ul className="avatar-slots">
          {slots.length === 0 ? (
            <li className="avatar-slot muted">без экипировки</li>
          ) : (
            slots.map(([slot, itemId]) => (
              <li key={slot} className="avatar-slot" title={itemId}>
                <span className="avatar-slot-name">{slot}</span>
                <span className="avatar-slot-id">{itemId}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
