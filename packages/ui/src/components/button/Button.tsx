import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "../icon/Icon";
import type { IconName } from "../../icons";
import { Spinner } from "../spinner/Spinner";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-(--duration-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary: "border border-border-strong bg-surface text-foreground hover:bg-surface-muted",
        ghost: "text-foreground hover:bg-surface-muted",
        danger: "bg-danger text-surface hover:bg-danger/90",
      },
      size: {
        sm: "min-h-8 px-3 text-sm",
        md: "min-h-10 px-4 text-md",
        lg: "min-h-12 px-6 text-lg",
      },
      fullWidth: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", fullWidth: false },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonStyles> {
  loading?: boolean;
  iconStart?: IconName;
  iconEnd?: IconName;
  children: ReactNode;
}

/** Renders a semantic button with consistent variants, optional icons, and a guarded loading state. */
export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  iconStart,
  iconEnd,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      aria-busy={loading}
      className={buttonStyles({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      type="button"
      {...props}
    >
      {loading ? <Spinner /> : iconStart ? <Icon name={iconStart} size="sm" /> : null}
      {children}
      {!loading && iconEnd ? <Icon name={iconEnd} size="sm" /> : null}
    </button>
  );
}
