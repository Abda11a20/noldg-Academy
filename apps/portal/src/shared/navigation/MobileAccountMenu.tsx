import { DropdownMenu, Icon, type DropdownMenuItem } from "@noldg/ui";
import { useTranslation } from "react-i18next";
import { useLanguageSwitcher } from "../i18n/useLanguageSwitcher";

export interface MobileAccountMenuProps {
  logoutLabel?: string | undefined;
  onLogout?: (() => void) | undefined;
  loggingOut?: boolean | undefined;
  open?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
}

/** Combines language and session actions in the compact mobile account menu.
 * @param props Optional logout action and its pending state.
 */
export function MobileAccountMenu({
  logoutLabel,
  onLogout,
  loggingOut = false,
  open,
  onOpenChange,
}: MobileAccountMenuProps) {
  const { t } = useTranslation("common");
  const { label, changeLanguage } = useLanguageSwitcher();
  const items: DropdownMenuItem[] = [
    { id: "language", label, onSelect: changeLanguage },
    ...(logoutLabel && onLogout
      ? [
          {
            id: "logout",
            label: logoutLabel,
            onSelect: onLogout,
            disabled: loggingOut,
            tone: "danger" as const,
          },
        ]
      : []),
  ];

  return (
    <DropdownMenu
      items={items}
      open={open}
      onOpenChange={onOpenChange}
      trigger={<Icon name="user" />}
      triggerLabel={t("mobileAccountMenu")}
    />
  );
}
