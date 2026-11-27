import { forwardRef, type InputHTMLAttributes } from "react";
import { Field } from "./Field";

export interface NumberFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "type" | "inputMode" | "min" | "max" | "step"
> {
  id: string;
  label: string;
  min: number;
  max: number;
  hint?: string;
  error?: string;
  required?: boolean;
}

/** Renders a labelled integer field with explicit range and validation copy.
 * @param props Field labels, inclusive bounds, and native input events.
 */
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField(
  { id, label, min, max, hint, error, required, className = "", ...props },
  ref,
) {
  const describedBy =
    [hint ? `${id}-hint` : undefined, error ? `${id}-error` : undefined]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <input
        {...props}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        className={`min-h-(--input-height-md) rounded-md border border-border bg-surface px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${className}`.trim()}
        id={id}
        inputMode="numeric"
        max={max}
        min={min}
        ref={ref}
        required={required}
        step={1}
        type="number"
      />
    </Field>
  );
});
