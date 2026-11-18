import type { HTMLAttributes, ReactNode } from "react";

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  spacing?: "sm" | "md" | "lg";
}

const spacingClasses = { sm: "gap-1", md: "gap-2", lg: "gap-3" } as const;

/** Arranges related buttons with consistent token-based spacing.
 * @param props Buttons, spacing size, and container attributes.
 */
export function ButtonGroup({
  children,
  spacing = "md",
  className = "",
  ...props
}: ButtonGroupProps) {
  return (
    <div
      className={`inline-flex flex-wrap ${spacingClasses[spacing]} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
