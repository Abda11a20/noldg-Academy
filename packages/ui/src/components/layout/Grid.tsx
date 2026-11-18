import type { HTMLAttributes, ReactNode } from "react";
export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  spacing?: "sm" | "md" | "lg";
}
const columns = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
} as const;
const gaps = { sm: "gap-2", md: "gap-4", lg: "gap-6" } as const;
/** Displays children in a responsive grid. @param props Column count, spacing, and container attributes. */
export function Grid({
  children,
  columns: count = 2,
  spacing = "md",
  className = "",
  ...props
}: GridProps) {
  return (
    <div className={`grid ${columns[count]} ${gaps[spacing]} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
