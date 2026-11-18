import type { HTMLAttributes, ReactNode } from "react";
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}
/** Renders a card header section. @param props Heading content and attributes. */
export function CardHeader({ children, className = "", ...props }: CardHeaderProps) {
  return (
    <header className={`border-b border-border p-4 ${className}`.trim()} {...props}>
      {children}
    </header>
  );
}
