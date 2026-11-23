import type { IconName } from "../../icons";
import { Button } from "../button/Button";

export interface NavItemProps {
  to: string;
  label: string;
  icon: IconName;
  active?: boolean;
  badge?: string;
}

/** Renders a role-filtered navigation link with active and optional badge states.
 * @param props Destination, translated label, registered icon, and display state.
 */
export function NavItem({ to, label, icon, active = false, badge }: NavItemProps) {
  return (
    <Button
      aria-current={active ? "page" : undefined}
      className="justify-start"
      fullWidth
      iconStart={icon}
      to={to}
      variant={active ? "secondary" : "ghost"}
    >
      {label}
      {badge ? (
        <span className="ms-auto rounded-full bg-primary-soft px-2 text-xs text-primary">
          {badge}
        </span>
      ) : null}
    </Button>
  );
}
