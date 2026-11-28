import { lazy, Suspense, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AppShell, Topbar, type NavItemProps } from "@noldg/ui";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { DeferredMobileAccountMenu } from "./DeferredMobileAccountMenu";
import { useLocation } from "react-router";
import { getNavigationForRole } from "./navigation";
import { ROUTE_PATHS } from "./routes";

const ROLE_ROOT_PATHS = new Set<string>([
  ROUTE_PATHS.student,
  ROUTE_PATHS.teacher,
  ROUTE_PATHS.admin,
]);

function isNavRouteActive(pathname: string, route: string): boolean {
  if (pathname === route) return true;
  if (route === ROUTE_PATHS.teacher && pathname.startsWith(`${ROUTE_PATHS.teacher}/courses/`)) {
    return true;
  }
  if (ROLE_ROOT_PATHS.has(route)) return false;
  return pathname.startsWith(`${route}/`);
}

const LazyMobileNav = lazy(() =>
  import("@noldg/ui").then(({ MobileNav }) => ({ default: MobileNav })),
);
const LazySidebar = lazy(() => import("@noldg/ui").then(({ Sidebar }) => ({ default: Sidebar })));

function createNavigationSlots(
  userRole: PortalFrameProps["userRole"],
  items: readonly NavItemProps[],
  labels: { navigation: string; open: string; close: string },
) {
  if (!userRole) return { sidebar: null, mobileNavigation: null };
  return {
    sidebar: (
      <Suspense fallback={null}>
        <LazySidebar items={items} label={labels.navigation} />
      </Suspense>
    ),
    mobileNavigation: (
      <Suspense fallback={null}>
        <LazyMobileNav
          items={items}
          label={labels.navigation}
          openLabel={labels.open}
          closeLabel={labels.close}
        />
      </Suspense>
    ),
  };
}

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
    active: isNavRouteActive(location.pathname, item.route),
  })) satisfies readonly NavItemProps[];
  const navigationSlots = createNavigationSlots(userRole, navItems, {
    navigation: t("navigation.label"),
    open: t("navigation.open"),
    close: t("navigation.close"),
  });
  return (
    <AppShell
      sidebar={navigationSlots.sidebar}
      mobileNavigation={null}
      topbar={
        <Topbar
          userMenuSlot={
            <DeferredMobileAccountMenu
              {...(logoutLabel ? { logoutLabel } : {})}
              {...(onLogout ? { onLogout } : {})}
              {...(loggingOut ? { loggingOut } : {})}
            />
          }
          mobileNavigationSlot={navigationSlots.mobileNavigation}
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
