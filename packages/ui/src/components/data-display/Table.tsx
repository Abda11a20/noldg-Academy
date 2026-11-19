import type { HTMLAttributes, ReactNode } from "react";
export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
  label: string;
}
/** Renders an accessible data table shell. @param props Table label, content, and attributes. */
export function Table({ children, label, className = "", ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        aria-label={label}
        className={`w-full border-collapse text-start ${className}`.trim()}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}
