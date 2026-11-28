import { forwardRef, type InputHTMLAttributes } from "react";
import { Field } from "./Field";

export interface DateTimeFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "type"
> {
  id: string;
  label: string;
  mode?: "datetime" | "date";
  hint?: string;
  error?: string;
  required?: boolean;
}

/** Renders a labelled native local date or date-time input with bounds and an accessible error. @param props Field labels and input attributes. */
export const DateTimeField = forwardRef<HTMLInputElement, DateTimeFieldProps>(
  function DateTimeField(
    { id, label, mode = "datetime", hint, error, required, className = "", ...props },
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
          ref={ref}
          required={required}
          type={mode === "date" ? "date" : "datetime-local"}
        />
      </Field>
    );
  },
);
