import { Outlet } from "react-router";
import { PortalFrame } from "../../shared/navigation/PortalFrame";
import { RequireAuth } from "../guards/RequireAuth";

/** Renders the protected empty student portal shell. */
export function StudentLayout() {
  return (
    <RequireAuth>
      <PortalFrame>
        <Outlet />
      </PortalFrame>
    </RequireAuth>
  );
}
