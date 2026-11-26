import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AppShell, MobileNav, Sidebar, Topbar, type NavItemProps } from "@noldg/ui";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLocation } from "react-router";

export interface PortalFrameProps {
  children: ReactNode;
  userName?: string;
  roleLabel?: string;
  logoutLabel?: string;
  onLogout?: () => void;
  loggingOut?: boolean;
  userRole?: "student" | "teacher" | "admin" | "super_admin";
}

/** Renders the shared empty portal header and page region. */
export function PortalFrame({
  children,
  userName,
  roleLabel,
  logoutLabel,
  onLogout,
  loggingOut,
  userRole,
}: PortalFrameProps) {
  const { t } = useTranslation("common");
  const location = useLocation();
  const navItems = (userRole ? getNavigationForRole(userRole) : []).map((item) => ({
    to: item.route,
    label: t(item.labelKey),
    icon: item.icon,
    active: location.pathname === item.route,
  })) satisfies readonly NavItemProps[];
  return (
    <AppShell
      sidebar={<Sidebar items={navItems} label={t("navigation.label")} />}
      mobileNavigation={null}
      topbar={
        <Topbar
          mobileNavigationSlot={
            <MobileNav
              items={navItems}
              label={t("navigation.label")}
              openLabel={t("navigation.open")}
              closeLabel={t("navigation.close")}
            />
          }
          languageSwitchSlot={<LanguageSwitcher />}
          logoAlt={t("logoAlt")}
          {...(userName ? { userName } : {})}
          {...(roleLabel ? { roleLabel } : {})}
          {...(logoutLabel ? { logoutLabel } : {})}
          {...(onLogout ? { onLogout } : {})}
          {...(loggingOut ? { loggingOut } : {})}
        />
      }
    >
      {children}
    </AppShell>
  );
}

import { getNavigationForRole } from "../../app/navigation";
