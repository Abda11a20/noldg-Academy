import type { HTMLAttributes } from "react";
import { Image } from "../image/Image";
import type { ImageKey } from "../../images";
export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  label: string;
  initials: string;
  asset?: ImageKey;
  remoteSrc?: string;
  size?: "sm" | "md" | "lg";
}
const sizes = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-lg" } as const;
/** Displays a registered avatar image or initials fallback. @param props Accessible label, image key, and fallback. */
export function Avatar({
  label,
  initials,
  asset,
  remoteSrc,
  size = "md",
  className = "",
  ...props
}: AvatarProps) {
  const hasImage = Boolean(asset || remoteSrc);
  return (
    <span
      {...(!hasImage ? { "aria-label": label, role: "img" } : {})}
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft font-semibold text-primary ${sizes[size]} ${className}`.trim()}
      {...props}
    >
      {asset || remoteSrc ? (
        <Image
          alt={label}
          {...(asset ? { asset } : {})}
          {...(remoteSrc ? { remoteSrc } : {})}
          className="size-full object-cover"
        />
      ) : (
        initials
      )}
    </span>
  );
}
