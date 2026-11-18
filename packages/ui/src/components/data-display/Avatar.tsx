import type { HTMLAttributes } from "react";
import { Image } from "../image/Image";
import type { ImageKey } from "../../images";
export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  label: string;
  initials: string;
  asset?: ImageKey;
  size?: "sm" | "md" | "lg";
}
const sizes = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-lg" } as const;
/** Displays a registered avatar image or initials fallback. @param props Accessible label, image key, and fallback. */
export function Avatar({
  label,
  initials,
  asset,
  size = "md",
  className = "",
  ...props
}: AvatarProps) {
  return (
    <span
      aria-label={label}
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft font-semibold text-primary ${sizes[size]} ${className}`.trim()}
      role="img"
      {...props}
    >
      {asset ? <Image alt={label} asset={asset} className="size-full object-cover" /> : initials}
    </span>
  );
}
