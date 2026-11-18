import { forwardRef } from "react";
import { Checkbox as RadixCheckbox } from "radix-ui";
import { Icon } from "../icon/Icon";
export interface CheckboxProps {
  id: string;
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean | "indeterminate") => void;
  disabled?: boolean;
  required?: boolean;
}
/** Renders a labelled, controlled or uncontrolled Radix checkbox. @param props Label, state, and native form flags. */
export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
  { id, label, checked, defaultChecked, onCheckedChange, disabled, required },
  ref,
) {
  return (
    <label className="inline-flex items-center gap-2 text-foreground" htmlFor={id}>
      <RadixCheckbox.Root
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        required={required}
        id={id}
        ref={ref}
        className="flex size-5 items-center justify-center rounded border border-border-strong bg-surface data-[state=checked]:border-primary data-[state=checked]:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        <RadixCheckbox.Indicator>
          <Icon name="check" size="sm" color="current" />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {label}
    </label>
  );
});
