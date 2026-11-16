import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { ROUTE_PATHS } from "../constants/routes";
import { useAuthSnapshot, type PortalRole } from "./auth-store";

export interface RequireRoleProps {
  children: ReactNode;
  roles: readonly PortalRole[];
}

/** Redirects anonymous users to login and authenticated users without an allowed role to not-found. */
export function RequireRole({ children, roles }: RequireRoleProps) {
  const auth = useAuthSnapshot();
  if (!auth.isAuthenticated) return <Navigate replace to={ROUTE_PATHS.login} />;
  return auth.role && roles.includes(auth.role) ? (
    children
  ) : (
    <Navigate replace to={ROUTE_PATHS.notFound} />
  );
}
