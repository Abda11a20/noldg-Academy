import type { HTMLAttributes, ReactNode } from "react";
export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  spacing?: "sm" | "md" | "lg";
}
const gaps = { sm: "gap-2", md: "gap-4", lg: "gap-6" } as const;
/** Places children in a vertical stack. @param props Spacing and container attributes. */
export function Stack({ children, spacing = "md", className = "", ...props }: StackProps) {
  return (
    <div className={`flex flex-col ${gaps[spacing]} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
