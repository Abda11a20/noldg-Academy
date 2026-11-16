import type { HTMLAttributes, ReactNode } from "react";

export interface VisuallyHiddenProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

/** Keeps accessible text available to assistive technology while hiding it visually. */
export function VisuallyHidden({ children, ...props }: VisuallyHiddenProps) {
  return (
    <span className="sr-only" {...props}>
      {children}
    </span>
  );
}
