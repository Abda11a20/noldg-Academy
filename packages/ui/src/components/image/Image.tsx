import { images, type ImageKey } from "../../images";

export interface ImageProps {
  asset: ImageKey;
  alt: string;
  fixedAspect?: boolean;
  className?: string;
}

/** Renders a registered image with required alternative text and lazy loading. */
export function Image({ asset, alt, fixedAspect = false, className = "" }: ImageProps) {
  const image = images[asset];
  const aspectClass = fixedAspect ? "aspect-video object-cover" : "h-auto";

  return (
    <img
      alt={alt}
      className={`${aspectClass} ${className}`.trim()}
      decoding="async"
      height={image.height}
      loading="lazy"
      src={image.src}
      width={image.width}
    />
  );
}
