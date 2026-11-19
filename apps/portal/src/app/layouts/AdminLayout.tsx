import { Outlet } from "react-router";
import { PortalFrame } from "../../shared/navigation/PortalFrame";
import { RequireRole } from "../guards/RequireRole";
import { RequireAuth } from "../guards/RequireAuth";
import { useAuthSnapshot } from "../../shared/auth/auth-store";
import { useLogout } from "../../features/auth/hooks/useLogout";
import { useTranslation } from "react-i18next";

/** Renders the empty account-management shell for authorized administrators. */
export function AdminLayout() {
  const { user } = useAuthSnapshot();
  const { signOut, loggingOut } = useLogout();
  const { t } = useTranslation("auth");
  return (
    <RequireAuth>
      <RequireRole roles={["admin", "super_admin"]}>
        <PortalFrame
          {...(user?.name ? { userName: user.name } : {})}
          roleLabel={t("roles.admin")}
          logoutLabel={t("logout")}
          onLogout={() => void signOut()}
          loggingOut={loggingOut}
        >
          <Outlet />
        </PortalFrame>
      </RequireRole>
    </RequireAuth>
  );
}
