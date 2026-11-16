import { Outlet } from "react-router";
import { PortalFrame } from "../../shared/navigation/PortalFrame";

/** Renders the empty authentication shell used before the F2 auth module. */
export function AuthLayout() {
  return (
    <PortalFrame>
      <Outlet />
    </PortalFrame>
  );
}
