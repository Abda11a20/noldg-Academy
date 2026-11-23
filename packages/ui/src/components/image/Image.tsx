import { images, type ImageKey } from "../../images";

export interface ImageProps {
  asset?: ImageKey;
  remoteSrc?: string;
  alt: string;
  fixedAspect?: boolean;
  className?: string;
}

/** Renders a registered image with required alternative text and lazy loading. */
export function Image({ asset, remoteSrc, alt, fixedAspect = false, className = "" }: ImageProps) {
  const image = asset ? images[asset] : undefined;
  const source = image?.src ?? safeImageSource(remoteSrc);
  if (!source) return null;
  const aspectClass = fixedAspect ? "aspect-video object-cover" : "h-auto";

  return (
    <img
      alt={alt}
      className={`${aspectClass} ${className}`.trim()}
      decoding="async"
      loading="lazy"
      referrerPolicy="no-referrer"
      src={source}
      {...(image ? { height: image.height, width: image.width } : {})}
    />
  );
}

function safeImageSource(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}
