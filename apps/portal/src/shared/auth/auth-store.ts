import { useSyncExternalStore } from "react";
import { getMe } from "@noldg/api/endpoints/auth";
import { tokenStore } from "@noldg/api/auth/token-store";
import { capabilities } from "@noldg/api/config/capabilities";
import { apiMode } from "@noldg/api/mocks/mode";
import type { AuthUser } from "@noldg/api/contracts/auth";
import { AppError, normalizeAppError } from "@noldg/api/errors";

export type PortalRole = AuthUser["role"];
type SessionStatus = "unknown" | "anonymous" | "authenticated" | "error";

export interface AuthSnapshot {
  status: SessionStatus;
  user: AuthUser | null;
  error: AppError | null;
}

const anonymousSnapshot: AuthSnapshot = { status: "anonymous", user: null, error: null };
const unknownSnapshot: AuthSnapshot = { status: "unknown", user: null, error: null };
let snapshot: AuthSnapshot = unknownSnapshot;
let initialization: Promise<void> | undefined;
let sessionGeneration = 0;
const listeners = new Set<() => void>();

function publish(nextSnapshot: AuthSnapshot): void {
  snapshot = nextSnapshot;
  listeners.forEach((listener) => listener());
}

function publishIfCurrent(generation: number, nextSnapshot: AuthSnapshot): void {
  if (generation === sessionGeneration) publish(nextSnapshot);
}

function shouldClearSession(error: AppError): boolean {
  return (
    error.status === 401 ||
    error.status === 404 ||
    (error.status === 403 && error.code === "ACCOUNT_SUSPENDED")
  );
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

/** Provides the current auth snapshot to non-React bootstrap checks and tests. */
export function getAuthSnapshot(): AuthSnapshot {
  return snapshot;
}

/** Initializes the user from the token store or refresh cookie once per app start. */
export function initializeAuthSession(): Promise<void> {
  if (!initialization) {
    const generation = sessionGeneration;
    initialization = (async () => {
      if (!tokenStore.getAccessToken()) {
        const refreshed =
          apiMode === "live" && capabilities.refreshCookie ? await tokenStore.refresh() : null;
        if (!refreshed) {
          publishIfCurrent(generation, anonymousSnapshot);
          return;
        }
      }
      try {
        const user = await getMe();
        publishIfCurrent(generation, { status: "authenticated", user, error: null });
      } catch (cause) {
        const error = normalizeAppError(cause);
        if (shouldClearSession(error)) {
          tokenStore.clear();
          publishIfCurrent(generation, anonymousSnapshot);
          return;
        }
        publishIfCurrent(generation, { status: "error", user: null, error });
      }
    })();
  }
  return initialization;
}

/** Publishes a successfully authenticated user without exposing the access token. */
export function setAuthenticatedUser(user: AuthUser): void {
  sessionGeneration += 1;
  publish({ status: "authenticated", user, error: null });
}

/** Clears the current session state and token after logout or a failed refresh. */
export function clearAuthSession(): void {
  sessionGeneration += 1;
  tokenStore.clear();
  publish(anonymousSnapshot);
}

/** Retries a transient session check without discarding the saved access token. */
export function retryAuthSession(): Promise<void> {
  sessionGeneration += 1;
  initialization = undefined;
  publish(unknownSnapshot);
  return initializeAuthSession();
}
