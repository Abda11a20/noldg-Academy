import { forwardRef, type InputHTMLAttributes } from "react";
import { Field } from "./Field";

export interface MoneyFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "type" | "inputMode"
> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  formattedValue?: string;
  formattedLabel?: string;
}

/** Renders an integer EGP input and optional server-value display without calculating amounts. @param props Field copy and native input attributes. */
export const MoneyField = forwardRef<HTMLInputElement, MoneyFieldProps>(function MoneyField(
  { id, label, hint, error, required, formattedValue, formattedLabel, className = "", ...props },
  ref,
) {
  const formattedAmount =
    formattedLabel && formattedValue ? `${formattedLabel}: ${formattedValue}` : undefined;
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
        ref={ref}
        required={required}
        step={1}
        type="number"
      />
      {formattedAmount ? (
        <output className="text-sm text-foreground-muted">{formattedAmount}</output>
      ) : null}
    </Field>
  );
});
