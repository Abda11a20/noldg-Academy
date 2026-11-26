import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { ROUTE_PATHS } from "../../shared/navigation/routes";
import { useAuthSnapshot, type PortalRole } from "../../shared/auth/auth-store";
import { SessionLoading } from "./SessionLoading";
import { SessionUnavailable } from "./SessionUnavailable";

export interface RequireRoleProps {
  children: ReactNode;
  roles: readonly PortalRole[];
}

/** Redirects anonymous users to login and authenticated users without an allowed role to not-found. */
export function RequireRole({ children, roles }: RequireRoleProps) {
  const auth = useAuthSnapshot();
  const location = useLocation();
  if (auth.status === "unknown") return <SessionLoading />;
  if (auth.status === "error") return <SessionUnavailable />;
  if (auth.status === "anonymous") {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate replace to={`${ROUTE_PATHS.login}?returnTo=${encodeURIComponent(returnTo)}`} />
    );
  }
  if (auth.user?.status === "suspended")
    return <Navigate replace to={ROUTE_PATHS.accountSuspended} />;
  return auth.user && roles.includes(auth.user.role) ? (
    children
  ) : (
    <Navigate replace to={ROUTE_PATHS.notFound} />
  );
}
