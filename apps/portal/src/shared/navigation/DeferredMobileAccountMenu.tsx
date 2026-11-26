import { Button } from "@noldg/ui";
import { useTranslation } from "react-i18next";
import type { MobileAccountMenuProps } from "./MobileAccountMenu";
import { useDeferredMobileAccountMenu } from "./useDeferredMobileAccountMenu";

export type DeferredMobileAccountMenuProps = Pick<
  MobileAccountMenuProps,
  "logoutLabel" | "onLogout" | "loggingOut"
>;

/** Renders a compact account trigger and loads its menu only after activation.
 * @param props Optional logout action and pending state.
 */
export function DeferredMobileAccountMenu(props: DeferredMobileAccountMenuProps) {
  const { t } = useTranslation("common");
  const { menuComponent: Menu, isOpen, openMenu, setIsOpen } = useDeferredMobileAccountMenu();

  if (Menu) return <Menu {...props} open={isOpen} onOpenChange={setIsOpen} />;

  return (
    <Button
      aria-label={t("mobileAccountMenu")}
      iconOnly
      iconStart="user"
      onClick={() => void openMenu()}
      variant="ghost"
    />
  );
}
