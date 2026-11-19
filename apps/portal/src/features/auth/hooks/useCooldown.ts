import { useEffect, useState } from "react";
import { AUTH_COOLDOWN_TICK_MS } from "../constants";

/** Tracks a resend cooldown in seconds and exposes a restart event. @param initialSeconds Initial cooldown value. */
export function useCooldown(initialSeconds = 0) {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const isCoolingDown = secondsRemaining > 0;
  useEffect(() => {
    if (!isCoolingDown) return undefined;
    const timer = window.setInterval(() => {
      setSecondsRemaining((current) => Math.max(current - 1, 0));
    }, AUTH_COOLDOWN_TICK_MS);
    return () => window.clearInterval(timer);
  }, [isCoolingDown]);

  const startCooldown = (seconds: number) => setSecondsRemaining(Math.max(0, seconds));
  return { secondsRemaining, startCooldown, canResend: secondsRemaining === 0 };
}
