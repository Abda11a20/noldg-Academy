import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { ROUTE_PATHS } from "../constants/routes";
import { useAuthSnapshot } from "./auth-store";

export interface RequireAuthProps {
  children: ReactNode;
}

/** Redirects anonymous visitors to the login shell and preserves their intended location. */
export function RequireAuth({ children }: RequireAuthProps) {
  const auth = useAuthSnapshot();
  const location = useLocation();
  return auth.isAuthenticated ? (
    children
  ) : (
    <Navigate replace state={{ returnTo: location }} to={ROUTE_PATHS.login} />
  );
}
