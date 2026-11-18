import { forwardRef } from "react";
import { Select as RadixSelect } from "radix-ui";
import { Icon } from "../icon/Icon";
import { Field } from "./Field";
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
export interface SelectProps {
  id: string;
  label: string;
  options: readonly SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}
/** Renders an accessible Radix select with controlled or uncontrolled value. @param props Label, options, and select state. */
export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    id,
    label,
    options,
    value,
    defaultValue,
    onValueChange,
    placeholder,
    hint,
    error,
    required,
    disabled,
  }: SelectProps,
  ref,
) {
  const describedBy =
    [hint ? `${id}-hint` : undefined, error ? `${id}-error` : undefined]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <RadixSelect.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        required={required}
        name={id}
      >
        <RadixSelect.Trigger
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          aria-label={label}
          className="flex min-h-(--input-height-md) items-center justify-between rounded-md border border-border bg-surface px-3 text-start text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          id={id}
          ref={ref}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon>
            <Icon name="chevronDown" size="sm" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content
            className="z-(--z-dropdown) rounded-md border border-border bg-surface p-1 shadow-md"
            position="popper"
          >
            <RadixSelect.Viewport>
              {options.map((option) => (
                <RadixSelect.Item
                  className="cursor-pointer rounded px-3 py-2 text-foreground data-[highlighted]:bg-surface-muted data-[disabled]:opacity-50"
                  disabled={option.disabled}
                  key={option.value}
                  value={option.value}
                >
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </Field>
  );
});
