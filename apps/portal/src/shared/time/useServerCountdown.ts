import { useEffect, useState } from "react";
import { getDisplayRemainingSeconds } from "./server-offset";

const DISPLAY_COUNTDOWN_TICK_MS = 1000;

/** Ticks a server-offset countdown for display while keeping expiry decisions server-owned.
 * @param expiresAt Server-provided expiry timestamp.
 * @param serverNow Server timestamp from the same response.
 * @param receivedAtMs Client receipt timestamp associated with the query result.
 */
export function useServerCountdown(
  expiresAt: string,
  serverNow: string,
  receivedAtMs: number,
): number {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), DISPLAY_COUNTDOWN_TICK_MS);
    return () => window.clearInterval(intervalId);
  }, []);
  return getDisplayRemainingSeconds(expiresAt, serverNow, receivedAtMs, now);
}
