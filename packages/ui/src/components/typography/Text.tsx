import type { HTMLAttributes, ReactNode } from "react";
export interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  tone?: "default" | "muted" | "subtle" | "danger";
}
const sizes = { sm: "text-sm", md: "text-md", lg: "text-lg" } as const;
const tones = {
  default: "text-foreground",
  muted: "text-foreground-muted",
  subtle: "text-foreground-subtle",
  danger: "text-danger",
} as const;
/** Renders body text with a semantic tone and size. @param props Text content, tone, and size. */
export function Text({
  children,
  size = "md",
  tone = "default",
  className = "",
  ...props
}: TextProps) {
  return (
    <p className={`${sizes[size]} ${tones[tone]} ${className}`.trim()} {...props}>
      {children}
    </p>
  );
}
