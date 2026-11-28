import { useState } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { logout } from "@noldg/api/endpoints/auth";
import { ROUTE_PATHS } from "../../../shared/navigation/routes";
import { clearAuthSession } from "../../../shared/auth/auth-store";

/** Clears the server session, query cache, and local auth state before returning to login. */
export function useLogout() {
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const signOut = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // Local auth must end even when the network cannot reach the logout route.
    } finally {
      clearAuthSession();
      queryClient.clear();
      await navigate(ROUTE_PATHS.login, { replace: true });
      setLoggingOut(false);
    }
  };
  return { signOut, loggingOut };
}
