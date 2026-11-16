import { Outlet } from "react-router";
import { PortalFrame } from "../../shared/navigation/PortalFrame";
import { RequireRole } from "../guards/RequireRole";

/** Renders the empty teacher shell for authenticated teacher accounts. */
export function TeacherLayout() {
  return (
    <RequireRole roles={["teacher"]}>
      <PortalFrame>
        <Outlet />
      </PortalFrame>
    </RequireRole>
  );
}
