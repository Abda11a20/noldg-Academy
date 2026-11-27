import { Button } from "../button/Button";

export interface OrderListItem {
  id: string;
  label: string;
}

export interface OrderListProps {
  label: string;
  items: readonly OrderListItem[];
  emptyLabel: string;
  moveUpLabel: (itemLabel: string) => string;
  moveDownLabel: (itemLabel: string) => string;
  removeLabel: (itemLabel: string) => string;
  onMove: (index: number, direction: "up" | "down") => void;
  onRemove: (id: string) => void;
}

/** Renders ordered items with accessible move and remove controls.
 * @param props Ordered values, action labels, and event callbacks.
 */
export function OrderList({
  label,
  items,
  emptyLabel,
  moveUpLabel,
  moveDownLabel,
  removeLabel,
  onMove,
  onRemove,
}: OrderListProps) {
  if (items.length === 0) return <p>{emptyLabel}</p>;
  return (
    <div aria-label={label} aria-live="polite" role="region">
      <ol className="space-y-2">
        {items.map((item, index) => (
          <li
            className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface p-3"
            key={item.id}
          >
            <span className="min-w-0 flex-1 text-foreground">{item.label}</span>
            <Button
              disabled={index === 0}
              onClick={() => onMove(index, "up")}
              size="sm"
              variant="secondary"
            >
              {moveUpLabel(item.label)}
            </Button>
            <Button
              disabled={index === items.length - 1}
              onClick={() => onMove(index, "down")}
              size="sm"
              variant="secondary"
            >
              {moveDownLabel(item.label)}
            </Button>
            <Button onClick={() => onRemove(item.id)} size="sm" variant="ghost">
              {removeLabel(item.label)}
            </Button>
          </li>
        ))}
      </ol>
    </div>
  );
}
