import { useCallback, useState } from "react";
import type { ComponentType } from "react";
import type { MobileAccountMenuProps } from "./MobileAccountMenu";

/** Defers the Radix account menu bundle until the mobile account control is opened. */
export function useDeferredMobileAccountMenu() {
  const [menuComponent, setMenuComponent] = useState<ComponentType<MobileAccountMenuProps> | null>(
    null,
  );
  const [isOpen, setIsOpen] = useState(false);

  const openMenu = useCallback(async () => {
    const { MobileAccountMenu } = await import("./MobileAccountMenu");
    setMenuComponent(() => MobileAccountMenu);
    setIsOpen(true);
  }, []);

  return { menuComponent, isOpen, openMenu, setIsOpen };
}
