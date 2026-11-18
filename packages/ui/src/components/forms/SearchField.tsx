import { forwardRef, type InputHTMLAttributes } from "react";
import { Icon } from "../icon/Icon";
export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}
/** Renders a labelled search input with a decorative search icon. @param props Label and input attributes. */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { label, className = "", ...props },
  ref,
) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center">
        <Icon name="search" color="muted" />
      </span>
      <input
        aria-label={label}
        className={`min-h-(--input-height-md) w-full rounded-md border border-border bg-surface ps-10 pe-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${className}`.trim()}
        ref={ref}
        type="search"
        {...props}
      />
    </div>
  );
});
