import type { IconColor } from "@noldg/ui";

export const buttonVariants = ["primary", "secondary", "ghost", "danger"] as const;
export const buttonSizes = ["sm", "md", "lg"] as const;
export const iconNames = [
  "menu",
  "close",
  "search",
  "user",
  "check",
  "alert",
  "chevronStart",
  "chevronEnd",
  "globe",
  "loader",
] as const;
export const iconColors = [
  "current",
  "primary",
  "muted",
  "subtle",
  "success",
  "warning",
  "danger",
  "info",
] as const satisfies readonly IconColor[];
export const buttonVariantLabelKeys = {
  primary: "buttonPrimary",
  secondary: "buttonSecondary",
  ghost: "buttonGhost",
  danger: "buttonDanger",
} as const;
export const textScaleClasses = [
  "text-xs",
  "text-sm",
  "text-md",
  "text-lg",
  "text-xl",
  "text-2xl",
] as const;

export const colorSwatches = [
  { key: "tokenPrimary", classes: "bg-primary text-primary-foreground" },
  { key: "tokenAccent", classes: "bg-accent text-surface" },
  { key: "tokenBackground", classes: "bg-background text-foreground border border-border" },
  { key: "tokenSurface", classes: "bg-surface text-foreground border border-border" },
  { key: "tokenForeground", classes: "bg-foreground text-surface" },
  { key: "tokenSuccess", classes: "bg-success text-surface" },
  { key: "tokenWarning", classes: "bg-warning text-surface" },
  { key: "tokenDanger", classes: "bg-danger text-surface" },
  { key: "tokenInfo", classes: "bg-info text-surface" },
] as const;
