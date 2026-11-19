import type { HTMLAttributes, ReactNode } from "react";
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  tone?: "neutral" | "primary" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
}
const tones = {
  neutral: "bg-surface-muted text-foreground",
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
} as const;
const sizes = { sm: "px-2 py-0.5 text-xs", md: "px-2.5 py-1 text-sm" } as const;
/** Renders a compact status label. @param props Badge text, semantic tone, and size. */
export function Badge({
  children,
  tone = "neutral",
  size = "md",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${tones[tone]} ${sizes[size]} ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
}
