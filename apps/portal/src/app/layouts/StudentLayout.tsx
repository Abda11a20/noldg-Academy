import { Outlet } from "react-router";
import { PortalFrame } from "../../shared/navigation/PortalFrame";
import { RequireRole } from "../guards/RequireRole";
import { RequireAuth } from "../guards/RequireAuth";
import { useAuthSnapshot } from "../../shared/auth/auth-store";
import { useLogout } from "../../features/auth/hooks/useLogout";
import { useTranslation } from "react-i18next";

/** Renders the protected empty student portal shell. */
export function StudentLayout() {
  const { user } = useAuthSnapshot();
  const { signOut, loggingOut } = useLogout();
  const { t } = useTranslation("auth");
  return (
    <RequireAuth>
      <RequireRole roles={["student"]}>
        <PortalFrame
          {...(user?.name ? { userName: user.name } : {})}
          roleLabel={t("roles.student")}
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
