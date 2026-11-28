import type { NavItemProps } from "./NavItem";
import { NavItem } from "./NavItem";

export interface SidebarProps {
  items: readonly NavItemProps[];
  label: string;
  onItemSelect?: (() => void) | undefined;
}

/** Renders the desktop navigation list.
 * @param props Translated navigation label and permitted items.
 */
export function Sidebar({ items, label, onItemSelect }: SidebarProps) {
  return (
    <nav aria-label={label} className="flex flex-col gap-2 p-4">
      {items.map((item) => (
        <NavItem key={item.to} {...item} onClick={onItemSelect} />
      ))}
    </nav>
  );
}
