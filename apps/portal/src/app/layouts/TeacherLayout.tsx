import { Navigate, Outlet } from "react-router";
import { PortalFrame } from "../../shared/navigation/PortalFrame";
import { RequireRole } from "../guards/RequireRole";
import { RequireAuth } from "../guards/RequireAuth";
import { useAuthSnapshot } from "../../shared/auth/auth-store";
import { useLogout } from "../../features/auth/hooks/useLogout";
import { useTranslation } from "react-i18next";
import { ROUTE_PATHS } from "../../shared/navigation/routes";

/** Renders the empty teacher shell for authenticated teacher accounts. */
export function TeacherLayout() {
  const { user } = useAuthSnapshot();
  const { signOut, loggingOut } = useLogout();
  const { t } = useTranslation("auth");
  if (user?.applicationStatus === "pending" || user?.applicationStatus === "rejected") {
    return <Navigate replace to={ROUTE_PATHS.teacherPending} />;
  }
  return (
    <RequireAuth>
      <RequireRole roles={["teacher"]}>
        <PortalFrame
          {...(user?.name ? { userName: user.name } : {})}
          roleLabel={t("roles.teacher")}
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
