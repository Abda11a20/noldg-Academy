import { DropdownMenu as Primitive } from "radix-ui";
import type { ReactNode } from "react";
import { useUiContext } from "../../providers/UiProvider";

export interface DropdownMenuItem {
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}
export interface DropdownMenuProps {
  trigger: ReactNode;
  triggerLabel: string;
  items: readonly DropdownMenuItem[];
}

/** Renders an accessible action menu with keyboard and focus handling.
 * @param props Trigger content and action entries.
 */
export function DropdownMenu({ trigger, triggerLabel, items }: DropdownMenuProps) {
  const { direction } = useUiContext();
  return (
    <Primitive.Root dir={direction === "rtl" ? "rtl" : "ltr"}>
      <Primitive.Trigger
        aria-label={triggerLabel}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md p-2 text-foreground hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        {trigger}
      </Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          align="end"
          className="z-dropdown min-w-40 rounded-md border border-border bg-surface p-1 shadow-md"
          sideOffset={4}
        >
          {items.map((item) => (
            <Primitive.Item
              className={`cursor-pointer rounded px-3 py-2 text-start outline-none focus:bg-surface-muted ${item.tone === "danger" ? "text-danger" : "text-foreground"}`}
              disabled={item.disabled}
              key={item.id}
              onSelect={item.onSelect}
            >
              {item.label}
            </Primitive.Item>
          ))}
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
