/** Computes display-only remaining time using the server clock offset.
 * @param expiresAt Server-provided order expiry timestamp.
 * @param serverNow Server timestamp from the same response.
 * @param clientNow Injected local clock, used only to advance the displayed countdown.
 * @returns Non-negative remaining seconds; the server remains authoritative for expiry.
 */
export function getDisplayRemainingSeconds(
  expiresAt: string,
  serverNow: string,
  receivedAtMs: number,
  clientNow: Date,
): number {
  const expiryMs = Date.parse(expiresAt);
  const serverMs = Date.parse(serverNow);
  if (!Number.isFinite(expiryMs) || !Number.isFinite(serverMs)) return 0;
  const initialRemaining = expiryMs - serverMs;
  const elapsed = Math.max(0, clientNow.getTime() - receivedAtMs);
  return Math.max(0, Math.floor((initialRemaining - elapsed) / 1000));
}
