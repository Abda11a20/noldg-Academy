import { useState } from "react";
/** Tracks the visual drag-over state for a file selection surface.
 * @returns Current active state and explicit enter/leave updates.
 */
export function useFileDragState() {
  const [dragging, setDragging] = useState(false);
  return {
    dragging,
    startDragging: () => setDragging(true),
    stopDragging: () => setDragging(false),
  };
}
