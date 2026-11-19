import type { ReactNode } from "react";
export interface FieldProps {
  id: string;
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  required?: boolean | undefined;
  children: ReactNode;
}
/** Connects a control to its visible label, hint, and validation message. @param props Field content and associated text. */
export function Field({ id, label, hint, error, required = false, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div
      aria-describedby={describedBy}
      className="flex flex-col gap-1.5"
      data-required={required || undefined}
    >
      <label className="font-medium text-foreground" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint ? (
        <span className="text-sm text-foreground-muted" id={hintId}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="text-sm text-danger" id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
