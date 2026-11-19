import type { HTMLAttributes, ReactNode } from "react";
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}
/** Renders the card footer section. @param props Footer content and attributes. */
export function CardFooter({ children, className = "", ...props }: CardFooterProps) {
  return (
    <footer className={`border-t border-border p-4 ${className}`.trim()} {...props}>
      {children}
    </footer>
  );
}
