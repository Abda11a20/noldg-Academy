import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from "react";
import type { IconName } from "../../icons";
import { useUiContext } from "../../providers/UiProvider";
import { ButtonContent } from "./ButtonContent";
import { ButtonLink } from "./ButtonLink";

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
      iconOnly: { true: "aspect-square px-0", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", fullWidth: false, iconOnly: false },
  },
);

export interface ButtonProps
  extends
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick">,
    VariantProps<typeof buttonStyles> {
  loading?: boolean;
  iconStart?: IconName;
  iconEnd?: IconName;
  iconOnly?: boolean;
  to?: string;
  target?: string;
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement> | undefined;
}

/** Renders a shared button or injected router link with variants, icons, and guarded loading.
 * @param props Visual variant, size, optional icons/navigation, state, and accessible label.
 * @throws Error when navigation lacks a router link provider or icon-only accessibility label.
 */
export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  iconStart,
  iconEnd,
  iconOnly = false,
  to,
  target,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const { linkComponent } = useUiContext();
  if (iconOnly && !props["aria-label"]) {
    throw new Error("Icon-only buttons require an accessible aria-label.");
  }
  const classes = buttonStyles({ variant, size, fullWidth, iconOnly, className });
  const contents = (
    <ButtonContent loading={loading} iconStart={iconStart} iconEnd={iconEnd}>
      {children}
    </ButtonContent>
  );

  if (to)
    return (
      <ButtonLink
        linkComponent={linkComponent}
        to={to}
        target={target}
        disabled={disabled}
        loading={loading}
        className={classes}
        ariaCurrent={props["aria-current"]}
        label={props["aria-label"]}
        id={props.id}
        rel={props.rel}
        title={props.title}
        onClick={props.onClick}
      >
        {contents}
      </ButtonLink>
    );

  return (
    <button
      aria-busy={loading}
      className={classes}
      disabled={disabled || loading}
      type="button"
      {...props}
    >
      {contents}
    </button>
  );
}
