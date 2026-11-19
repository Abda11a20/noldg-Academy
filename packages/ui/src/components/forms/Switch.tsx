import { forwardRef } from "react";
import { Switch as RadixSwitch } from "radix-ui";
export interface SwitchProps {
  id: string;
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}
/** Renders a labelled, controlled or uncontrolled Radix switch. @param props Label and switch state. */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { id, label, checked, defaultChecked, onCheckedChange, disabled },
  ref,
) {
  return (
    <label className="inline-flex items-center gap-3 text-foreground" htmlFor={id}>
      <RadixSwitch.Root
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        id={id}
        ref={ref}
        className="relative h-6 w-11 rounded-full bg-border-strong transition-colors data-[state=checked]:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        <RadixSwitch.Thumb className="absolute start-0.5 block size-5 rounded-full bg-surface transition-transform data-[state=checked]:translate-x-5 rtl:data-[state=checked]:-translate-x-5" />
      </RadixSwitch.Root>
      {label}
    </label>
  );
});
