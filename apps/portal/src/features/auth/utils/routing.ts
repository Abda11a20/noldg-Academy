import type { AuthUser } from "@noldg/api/contracts/auth";
import { ROUTE_PATHS } from "../../../shared/navigation/routes";

/** Chooses the authenticated landing route from account status and role. @param user Normalized user returned by the API. */
export function authDestinationForUser(user: AuthUser): string {
  if (user.status === "suspended") return ROUTE_PATHS.accountSuspended;
  if (
    user.role === "teacher" &&
    (user.applicationStatus === "pending" || user.applicationStatus === "rejected")
  ) {
    return ROUTE_PATHS.teacherPending;
  }
  if (user.role === "admin" || user.role === "super_admin") return ROUTE_PATHS.admin;
  if (user.role === "teacher") return ROUTE_PATHS.teacher;
  return ROUTE_PATHS.student;
}
