import { useSyncExternalStore } from "react";
import { getMe } from "@noldg/api/endpoints/auth";
import { tokenStore } from "@noldg/api/auth/token-store";
import type { AuthUser } from "@noldg/api/contracts/auth";

export type PortalRole = AuthUser["role"];
type SessionStatus = "unknown" | "anonymous" | "authenticated";

export interface AuthSnapshot {
  status: SessionStatus;
  user: AuthUser | null;
}

const anonymousSnapshot: AuthSnapshot = { status: "anonymous", user: null };
let snapshot: AuthSnapshot = { status: "unknown", user: null };
let initialization: Promise<void> | undefined;
const listeners = new Set<() => void>();

function publish(nextSnapshot: AuthSnapshot): void {
  snapshot = nextSnapshot;
  listeners.forEach((listener) => listener());
}

/** Reads the current auth snapshot through React's external-store subscription API. */
export function useAuthSnapshot(): AuthSnapshot {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => snapshot,
    () => snapshot,
  );
}

/** Initializes the user from the token store once per app start; missing tokens become anonymous. */
export function initializeAuthSession(): Promise<void> {
  if (!initialization) {
    initialization = (async () => {
      if (!tokenStore.getAccessToken()) {
        publish(anonymousSnapshot);
        return;
      }
      try {
        const user = await getMe();
        publish({ status: "authenticated", user });
      } catch {
        tokenStore.clear();
        publish(anonymousSnapshot);
      }
    })();
  }
  return initialization;
}

/** Publishes a successfully authenticated user without exposing the access token. */
export function setAuthenticatedUser(user: AuthUser): void {
  publish({ status: "authenticated", user });
}

/** Clears the current session state and token after logout or a failed refresh. */
export function clearAuthSession(): void {
  tokenStore.clear();
  publish(anonymousSnapshot);
}
