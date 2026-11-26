import { useState, type ReactNode } from "react";
import { Dialog as Primitive } from "radix-ui";
import type { NavItemProps } from "./NavItem";
import { Sidebar } from "./Sidebar";
import { Button } from "../button/Button";

export interface MobileNavProps {
  items: readonly NavItemProps[];
  label: string;
  openLabel: string;
  closeLabel: string;
  trigger?: ReactNode;
}

/** Renders a modal navigation drawer for narrow viewports.
 * @param props Navigation items and translated accessibility labels.
 */
export function MobileNav({ items, label, openLabel, closeLabel, trigger }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  return (
    <Primitive.Root open={open} onOpenChange={setOpen}>
      <Primitive.Trigger asChild>
        <Button
          aria-label={openLabel}
          className="md:hidden"
          iconOnly
          iconStart="menu"
          variant="ghost"
        >
          {trigger}
        </Button>
      </Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Overlay className="fixed inset-0 z-overlay bg-overlay md:hidden" />
        <Primitive.Content className="fixed inset-y-0 start-0 z-modal w-72 bg-surface p-4 shadow-md focus:outline-none md:hidden">
          <Primitive.Title className="sr-only">{label}</Primitive.Title>
          <Primitive.Close asChild>
            <Button
              aria-label={closeLabel}
              className="mb-4"
              iconOnly
              iconStart="close"
              variant="ghost"
            />
          </Primitive.Close>
          <Sidebar items={items} label={label} />
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
