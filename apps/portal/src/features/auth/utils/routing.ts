import type { AuthUser } from "@noldg/api/contracts/auth";
import { ROUTE_PATHS } from "../../../shared/navigation/routes";
import { sanitizeReturnTo } from "./return-to";

function rolePrefix(role: AuthUser["role"]): string {
  if (role === "admin" || role === "super_admin") return ROUTE_PATHS.admin;
  if (role === "teacher") return ROUTE_PATHS.teacher;
  return ROUTE_PATHS.student;
}

function matchesRolePath(path: string, prefix: string): boolean {
  const pathname = path.split(/[?#]/, 1)[0] ?? "";
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Chooses the authenticated landing route from account status and role. @param user Normalized user returned by the API. */
export function authDestinationForUser(user: AuthUser): string {
  if (user.status === "suspended") return ROUTE_PATHS.accountSuspended;
  if (
    user.role === "teacher" &&
    (user.applicationStatus === "pending" || user.applicationStatus === "rejected")
  ) {
    return ROUTE_PATHS.teacherPending;
  }
  return rolePrefix(user.role);
}

/** Resolves a post-login destination, rejecting returnTo paths outside the user's allowed role area. */
export function resolvePostLoginDestination(user: AuthUser, rawReturnTo: string | null): string {
  const defaultDestination = authDestinationForUser(user);
  if (
    defaultDestination === ROUTE_PATHS.accountSuspended ||
    defaultDestination === ROUTE_PATHS.teacherPending
  ) {
    return defaultDestination;
  }
  const safeReturnTo = sanitizeReturnTo(rawReturnTo);
  if (safeReturnTo && matchesRolePath(safeReturnTo, rolePrefix(user.role))) return safeReturnTo;
  return defaultDestination;
}
