import type { HTMLAttributes } from "react";

export interface CountdownProps extends HTMLAttributes<HTMLTimeElement> {
  remainingSeconds: number;
  label: string;
}

/** Displays server-derived remaining time without making expiry decisions.
 * @param props Remaining seconds, localized label, and time element attributes.
 */
export function Countdown({ remainingSeconds, label, ...props }: CountdownProps) {
  const safeSeconds = Math.max(0, Math.floor(remainingSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  const value = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return (
    <time aria-label={label} dateTime={`PT${safeSeconds}S`} {...props}>
      {value}
    </time>
  );
}
