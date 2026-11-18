import { forwardRef, type InputHTMLAttributes } from "react";
import { Field } from "./Field";
export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
}
/** Renders a labelled text input with forwarded ref support. @param props Field copy and native input attributes. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { id, label, hint, error, required, className = "", ...props },
  ref,
) {
  const describedBy =
    [hint ? `${id}-hint` : undefined, error ? `${id}-error` : undefined]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <input
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        className={`min-h-(--input-height-md) rounded-md border border-border bg-surface px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${className}`.trim()}
        id={id}
        ref={ref}
        required={required}
        type="text"
        {...props}
      />
    </Field>
  );
});
