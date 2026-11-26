import { Toast as Primitive } from "radix-ui";
import { Button } from "../button/Button";
import type { ToastInput } from "./ToastProvider";
import { TOAST_DURATION_MS } from "./toast-constants";

interface ToastItemViewProps {
  item: ToastInput & { id: number };
  dismissLabel: string;
  onDismiss: (id: number) => void;
}

/** Renders one accessible toast message with a tone and dismiss action.
 * @param props Toast content, translated dismissal label, and close event.
 */
export function ToastItemView({ item, dismissLabel, onDismiss }: ToastItemViewProps) {
  const toneClass = {
    info: "border-info",
    success: "border-success",
    warning: "border-warning",
    danger: "border-danger",
  }[item.tone ?? "info"];
  return (
    <Primitive.Root
      duration={TOAST_DURATION_MS}
      className={`relative rounded-md border bg-surface p-4 shadow-md ${toneClass}`}
      onOpenChange={(open) => {
        if (!open) onDismiss(item.id);
      }}
    >
      <Primitive.Title className="font-semibold text-foreground">{item.title}</Primitive.Title>
      {item.description ? (
        <Primitive.Description className="mt-1 text-foreground-muted">
          {item.description}
        </Primitive.Description>
      ) : null}
      <Primitive.Close aria-label={dismissLabel} asChild>
        <Button
          className="absolute end-2 top-2"
          iconOnly
          iconStart="close"
          size="sm"
          variant="ghost"
        />
      </Primitive.Close>
    </Primitive.Root>
  );
}
