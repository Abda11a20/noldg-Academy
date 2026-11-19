import { forwardRef, type InputHTMLAttributes } from "react";
import { usePasswordVisibility } from "../../hooks/usePasswordVisibility";
import { Icon } from "../icon/Icon";
import { Field } from "./Field";
export interface PasswordFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "type"
> {
  id: string;
  label: string;
  showLabel: string;
  hideLabel: string;
  hint?: string;
  error?: string;
  required?: boolean;
}
/** Renders a password input with an accessible show/hide control. @param props Labels, validation, and input attributes. */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField(
    { id, label, showLabel, hideLabel, hint, error, required, className = "", ...props },
    ref,
  ) {
    const { visible, toggleVisibility } = usePasswordVisibility();
    const describedBy =
      [hint ? `${id}-hint` : undefined, error ? `${id}-error` : undefined]
        .filter(Boolean)
        .join(" ") || undefined;
    return (
      <Field id={id} label={label} hint={hint} error={error} required={required}>
        <div className="relative">
          <input
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
            className={`min-h-(--input-height-md) w-full rounded-md border border-border bg-surface px-3 pe-12 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${className}`.trim()}
            id={id}
            ref={ref}
            required={required}
            type={visible ? "text" : "password"}
            {...props}
          />
          <button
            aria-label={visible ? hideLabel : showLabel}
            className="absolute inset-y-0 end-0 px-3 text-foreground-muted"
            onClick={toggleVisibility}
            type="button"
          >
            <Icon name={visible ? "eyeOff" : "eye"} />
          </button>
        </div>
      </Field>
    );
  },
);
