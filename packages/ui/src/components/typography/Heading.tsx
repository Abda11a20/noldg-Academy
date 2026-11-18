import type { ElementType, HTMLAttributes, ReactNode } from "react";
export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  level: 1 | 2 | 3 | 4;
  size?: "sm" | "md" | "lg" | "xl";
}
const sizes = { sm: "text-lg", md: "text-xl", lg: "text-2xl", xl: "text-3xl" } as const;
/** Renders a semantic heading whose visual size is independent. @param props Level, size, and text. */
export function Heading({ children, level, size = "lg", className = "", ...props }: HeadingProps) {
  const Tag = `h${level}` as ElementType;
  return (
    <Tag className={`font-semibold text-foreground ${sizes[size]} ${className}`.trim()} {...props}>
      {children}
    </Tag>
  );
}
