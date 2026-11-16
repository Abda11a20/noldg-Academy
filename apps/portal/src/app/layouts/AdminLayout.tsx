import { Outlet } from "react-router";
import { PortalFrame } from "../../shared/navigation/PortalFrame";
import { RequireRole } from "../guards/RequireRole";

/** Renders the empty account-management shell for authorized administrators. */
export function AdminLayout() {
  return (
    <RequireRole roles={["admin", "super_admin"]}>
      <PortalFrame>
        <Outlet />
      </PortalFrame>
    </RequireRole>
  );
}
