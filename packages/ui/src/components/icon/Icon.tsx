import {
  iconRegistry,
  getIconDirectionBehavior,
  type IconDirection,
  type IconName,
} from "../../icons";
import "./Icon.css";

const sizeClasses = { sm: "size-4", md: "size-5", lg: "size-6" } as const;
const colorClasses = {
  current: "text-current",
  primary: "text-primary",
  muted: "text-foreground-muted",
  subtle: "text-foreground-subtle",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
} as const;

export type IconColor = keyof typeof colorClasses;

export interface IconProps {
  name: IconName;
  size?: keyof typeof sizeClasses;
  color?: IconColor;
  direction?: IconDirection;
  label?: string;
  className?: string;
}

/** Renders a registered, optionally labelled icon and flips directional glyphs in RTL. */
export function Icon({
  name,
  size = "md",
  color = "current",
  direction = "auto",
  label,
  className = "",
}: IconProps) {
  const definition = iconRegistry[name];
  const directionBehavior = getIconDirectionBehavior(name, direction);
  const directionClass =
    directionBehavior === "flip"
      ? "icon-flipped"
      : directionBehavior === "auto"
        ? "icon-direction-auto"
        : "";
  const classes = [sizeClasses[size], colorClasses[color], directionClass, className]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={classes}
      fill="none"
      role={label ? "img" : undefined}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {label ? <title>{label}</title> : null}
      <path d={definition.path} />
    </svg>
  );
}
