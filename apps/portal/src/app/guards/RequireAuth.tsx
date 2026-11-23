import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { ROUTE_PATHS } from "../../shared/navigation/routes";
import { useAuthSnapshot } from "../../shared/auth/auth-store";
import { SessionLoading } from "./SessionLoading";

export interface RequireAuthProps {
  children: ReactNode;
}

/** Redirects anonymous visitors to the login shell and preserves their intended location. */
export function RequireAuth({ children }: RequireAuthProps) {
  const auth = useAuthSnapshot();
  const location = useLocation();
  if (auth.status === "unknown") return <SessionLoading />;
  if (auth.status === "anonymous") {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate replace to={`${ROUTE_PATHS.login}?returnTo=${encodeURIComponent(returnTo)}`} />
    );
  }
  if (auth.user?.status === "suspended")
    return <Navigate replace to={ROUTE_PATHS.accountSuspended} />;
  return children;
}
