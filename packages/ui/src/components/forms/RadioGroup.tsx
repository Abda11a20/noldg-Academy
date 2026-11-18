import { forwardRef } from "react";
import { RadioGroup as RadixRadioGroup } from "radix-ui";
import { Icon } from "../icon/Icon";
import type { SelectOption } from "./Select";
export interface RadioGroupProps {
  id: string;
  label: string;
  options: readonly SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  orientation?: "horizontal" | "vertical";
}
/** Renders a labelled, keyboard-navigable Radix radio group. @param props Options and controlled or uncontrolled state. */
export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup(
  {
    id,
    label,
    options,
    value,
    defaultValue,
    onValueChange,
    disabled,
    required,
    orientation = "vertical",
  }: RadioGroupProps,
  ref,
) {
  return (
    <fieldset className="flex flex-col gap-3" disabled={disabled}>
      <legend className="mb-2 font-medium text-foreground">{label}</legend>
      <RadixRadioGroup.Root
        aria-label={label}
        className={`flex ${orientation === "vertical" ? "flex-col" : "flex-row flex-wrap"} gap-3`}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        required={required}
        name={id}
        ref={ref}
      >
        {options.map((option) => (
          <label className="inline-flex items-center gap-2 text-foreground" key={option.value}>
            <RadixRadioGroup.Item
              className="flex size-5 items-center justify-center rounded-full border border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              disabled={option.disabled}
              value={option.value}
            >
              <RadixRadioGroup.Indicator>
                <Icon name="check" size="sm" />
              </RadixRadioGroup.Indicator>
            </RadixRadioGroup.Item>
            {option.label}
          </label>
        ))}
      </RadixRadioGroup.Root>
    </fieldset>
  );
});
