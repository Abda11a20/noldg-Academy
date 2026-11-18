import type { HTMLAttributes } from "react";
export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: "full" | "half" | "third";
  height?: "sm" | "md" | "lg";
}
const widths = { full: "w-full", half: "w-1/2", third: "w-1/3" } as const;
const heights = { sm: "h-3", md: "h-5", lg: "h-8" } as const;
/** Renders an animated placeholder with an accessible busy state. @param props Placeholder dimensions. */
export function Skeleton({
  width = "full",
  height = "md",
  className = "",
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded bg-surface-muted ${widths[width]} ${heights[height]} ${className}`.trim()}
      {...props}
    />
  );
}
