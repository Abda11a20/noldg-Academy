import type { HTMLAttributes, ReactNode } from "react";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "full";
}
const sizes = { sm: "max-w-3xl", md: "max-w-5xl", lg: "max-w-7xl", full: "max-w-none" } as const;
/** Centers content within a responsive maximum width. @param props Size and container attributes. */
export function Container({ children, size = "lg", className = "", ...props }: ContainerProps) {
  return (
    <div className={`mx-auto w-full px-4 ${sizes[size]} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
