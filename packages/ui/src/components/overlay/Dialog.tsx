import { useRef, type ReactNode } from "react";
import { Dialog as Primitive } from "radix-ui";
import { Button } from "../button/Button";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  closeLabel: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Renders an accessible modal dialog with focus management supplied by Radix.
 * @param props Controlled visibility, accessible text, body and optional actions.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  children,
  footer,
}: DialogProps) {
  const opener = useRef<HTMLElement | null>(null);
  return (
    <Primitive.Root open={open} onOpenChange={onOpenChange}>
      <Primitive.Portal>
        <Primitive.Overlay className="fixed inset-0 z-overlay bg-overlay/60" />
        <Primitive.Content
          className="fixed start-1/2 top-1/2 z-modal max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-surface p-6 text-foreground shadow-md focus:outline-none rtl:translate-x-1/2"
          onOpenAutoFocus={() => {
            opener.current =
              document.activeElement instanceof HTMLElement ? document.activeElement : null;
          }}
          onCloseAutoFocus={(event) => {
            if (!opener.current?.isConnected) return;
            event.preventDefault();
            opener.current.focus();
          }}
        >
          <Primitive.Title className="text-xl font-semibold">{title}</Primitive.Title>
          {description ? (
            <Primitive.Description className="mt-2 text-foreground-muted">
              {description}
            </Primitive.Description>
          ) : null}
          <div className="mt-5">{children}</div>
          {footer ? <div className="mt-6 flex justify-end gap-3">{footer}</div> : null}
          <Primitive.Close asChild>
            <Button
              aria-label={closeLabel}
              className="absolute end-3 top-3"
              iconOnly
              iconStart="close"
              size="sm"
              variant="ghost"
            />
          </Primitive.Close>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
