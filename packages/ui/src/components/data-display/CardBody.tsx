import type { HTMLAttributes, ReactNode } from "react";
export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}
/** Renders the main card content section. @param props Body content and attributes. */
export function CardBody({ children, className = "", ...props }: CardBodyProps) {
  return (
    <div className={`p-4 ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
