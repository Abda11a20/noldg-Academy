import { useEffect, useState } from "react";

const WATERMARK_INTERVAL_MS = 12_000;
const WATERMARK_POSITIONS = [
  "start-4 top-4",
  "end-4 top-4",
  "start-4 bottom-16",
  "end-4 bottom-16",
] as const;

export interface WatermarkProps {
  text: string;
  random?: () => number;
}

/** Renders a low-emphasis, periodically repositioned player watermark.
 * @param props Watermark text and injectable random source; empty text renders nothing.
 */
export function Watermark({ text, random = Math.random }: WatermarkProps) {
  const [position, setPosition] = useState(0);
  useEffect(() => {
    if (!text) return;
    const timer = window.setInterval(() => {
      const next = Math.floor(random() * WATERMARK_POSITIONS.length);
      setPosition((current) =>
        next === current ? (current + 1) % WATERMARK_POSITIONS.length : next,
      );
    }, WATERMARK_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [random, text]);
  if (!text) return null;
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute z-(--z-overlay) opacity-25 ${WATERMARK_POSITIONS[position]}`}
    >
      {text}
    </span>
  );
}
