import { Tabs as Primitive } from "radix-ui";
import type { ReactNode } from "react";
import { useUiContext } from "../../providers/UiProvider";

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
}
export interface TabsProps {
  items: readonly TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  label: string;
}

/** Renders accessible, keyboard-navigable tabs.
 * @param props Tab labels and panels with optional controlled selection.
 */
export function Tabs({ items, defaultValue, value, onValueChange, label }: TabsProps) {
  const { direction } = useUiContext();
  return (
    <Primitive.Root
      defaultValue={defaultValue ?? items[0]?.value}
      value={value}
      onValueChange={onValueChange}
      dir={direction === "rtl" ? "rtl" : "ltr"}
    >
      <Primitive.List aria-label={label} className="flex gap-1 border-b border-border">
        {items.map((item) => (
          <Primitive.Trigger
            className="border-b-2 border-transparent px-4 py-3 text-foreground-muted data-[state=active]:border-primary data-[state=active]:text-primary"
            key={item.value}
            value={item.value}
          >
            {item.label}
          </Primitive.Trigger>
        ))}
      </Primitive.List>
      {items.map((item) => (
        <Primitive.Content className="pt-4" key={item.value} value={item.value}>
          {item.content}
        </Primitive.Content>
      ))}
    </Primitive.Root>
  );
}
