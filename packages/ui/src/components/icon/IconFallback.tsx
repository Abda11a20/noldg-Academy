export interface IconFallbackProps {
  className: string;
  label?: string | undefined;
}

/** Keeps icon dimensions and its accessible name stable while a lazy glyph loads.
 * @param props Applied classes and optional accessible label.
 */
export function IconFallback({ className, label }: IconFallbackProps) {
  return (
    <span
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={className}
      role={label ? "img" : undefined}
    />
  );
}
