import type { HTMLAttributes, ReactNode } from "react";
export interface InlineProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  spacing?: "sm" | "md" | "lg";
}
const gaps = { sm: "gap-2", md: "gap-4", lg: "gap-6" } as const;
/** Places children in a wrapping inline row with logical layout. @param props Spacing and row attributes. */
export function Inline({ children, spacing = "md", className = "", ...props }: InlineProps) {
  return (
    <div className={`flex flex-wrap items-center ${gaps[spacing]} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
