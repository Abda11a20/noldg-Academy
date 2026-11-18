import type { HTMLAttributes } from "react";
export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: "horizontal" | "vertical";
}
/** Separates adjacent content with a semantic separator. @param props Orientation and element attributes. */
export function Divider({ orientation = "horizontal", className = "", ...props }: DividerProps) {
  return (
    <hr
      aria-orientation={orientation}
      className={`border-0 bg-border ${orientation === "horizontal" ? "h-px w-full" : "h-full w-px"} ${className}`.trim()}
      {...props}
    />
  );
}
