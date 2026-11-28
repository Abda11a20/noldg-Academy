import { Navigate, Outlet } from "react-router";
import { PortalFrame } from "../../shared/navigation/PortalFrame";
import { RequireRole } from "../guards/RequireRole";
import { RequireAuth } from "../guards/RequireAuth";
import { useAuthSnapshot } from "../../shared/auth/auth-store";
import { useLogout } from "../../features/auth";
import { useTranslation } from "react-i18next";
import { ROUTE_PATHS } from "../../shared/navigation/routes";

/** Renders the teacher workspace shell after verifying authentication, role, and approval status. */
export function TeacherLayout() {
  const { user } = useAuthSnapshot();
  const { signOut, loggingOut } = useLogout();
  const { t } = useTranslation("auth");
  const pendingApproval =
    user?.applicationStatus === "pending" || user?.applicationStatus === "rejected";
  return (
    <RequireAuth>
      <RequireRole roles={["teacher"]}>
        {pendingApproval ? (
          <Navigate replace to={ROUTE_PATHS.teacherPending} />
        ) : (
          <PortalFrame
            userRole="teacher"
            {...(user?.name ? { userName: user.name } : {})}
            roleLabel={t("roles.teacher")}
            logoutLabel={t("logout")}
            onLogout={() => void signOut()}
            loggingOut={loggingOut}
          >
            <Outlet />
          </PortalFrame>
        )}
      </RequireRole>
    </RequireAuth>
  );
}
