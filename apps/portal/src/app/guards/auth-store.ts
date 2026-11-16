import { useSyncExternalStore } from "react";

export type PortalRole = "student" | "teacher" | "admin" | "super_admin";

export interface AuthSnapshot {
  isAuthenticated: boolean;
  role: PortalRole | null;
}

const anonymousSnapshot: AuthSnapshot = { isAuthenticated: false, role: null };

/** Stub auth store used until the F2 authentication module is connected. */
const authStore = {
  subscribe: (listener: () => void) => {
    void listener;
    return () => undefined;
  },
  getSnapshot: () => anonymousSnapshot,
};

/** Reads the current auth snapshot through React's external-store subscription API. */
export function useAuthSnapshot(): AuthSnapshot {
  return useSyncExternalStore(authStore.subscribe, authStore.getSnapshot, authStore.getSnapshot);
}
