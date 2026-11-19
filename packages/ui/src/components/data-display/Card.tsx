import type { HTMLAttributes, ReactNode } from "react";
export interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}
/** Renders a semantic card container. @param props Card content and section attributes. */
export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <article
      className={`rounded-lg border border-border bg-surface shadow-sm ${className}`.trim()}
      {...props}
    >
      {children}
    </article>
  );
}
