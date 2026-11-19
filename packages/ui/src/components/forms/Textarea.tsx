import { forwardRef, type TextareaHTMLAttributes } from "react";
import { Field } from "./Field";
export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  showCharacterCount?: boolean;
}
/** Renders a labelled multiline text control and optional count. @param props Field text and textarea attributes. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    id,
    label,
    hint,
    error,
    required,
    showCharacterCount = false,
    value,
    defaultValue,
    maxLength,
    className = "",
    ...props
  },
  ref,
) {
  const currentLength = String(value ?? defaultValue ?? "").length;
  const describedBy =
    [hint ? `${id}-hint` : undefined, error ? `${id}-error` : undefined]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <textarea
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        className={`min-h-24 rounded-md border border-border bg-surface p-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${className}`.trim()}
        id={id}
        maxLength={maxLength}
        ref={ref}
        required={required}
        value={value}
        defaultValue={defaultValue}
        {...props}
      />
      {showCharacterCount ? (
        <span className="text-end text-sm text-foreground-muted">
          {currentLength}
          {maxLength ? ` / ${maxLength}` : ""}
        </span>
      ) : null}
    </Field>
  );
});
