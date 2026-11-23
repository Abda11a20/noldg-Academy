import { apiMode } from "../mocks/mode";

type AuthHeaderStrategy = "target" | "legacy";

const configuredStrategy = import.meta.env.VITE_AUTH_HEADER_STRATEGY;

/** The single selection point for target Bearer and temporary backend token headers. */
const authHeaderStrategy: AuthHeaderStrategy =
  configuredStrategy === "target" || configuredStrategy === "legacy"
    ? configuredStrategy
    : apiMode === "live"
      ? "legacy"
      : "target";

/** Builds the selected authentication header without exposing token values to logs. */
export function createAuthHeaders(accessToken: string): Record<string, string> {
  return authHeaderStrategy === "target"
    ? { Authorization: `Bearer ${accessToken}` }
    : { token: accessToken };
}
