import { brand } from "../../brand/brand";
import { Image } from "../image/Image";

export interface LogoProps {
  alt: string;
  className?: string;
}

/** Renders the registered brand wordmark using its supplied accessible label. */
export function Logo({ alt, className = "" }: LogoProps) {
  return <Image alt={alt} asset={brand.logoAsset} className={className} />;
}
