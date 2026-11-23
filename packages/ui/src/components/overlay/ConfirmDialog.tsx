import { useState } from "react";
import { Button } from "../button/Button";
import { Dialog } from "./Dialog";
import { Textarea } from "../forms/Textarea";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  closeLabel: string;
  confirmLabel: string;
  cancelLabel: string;
  reason?: { id: string; label: string; hint?: string; minimumLength: number };
  onConfirm: (reason?: string) => void;
}

/** Renders a confirmation dialog and optionally requires a reason of a configured length.
 * @param props Labels, state, confirmation callback, and optional reason requirements.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  confirmLabel,
  cancelLabel,
  reason,
  onConfirm,
}: ConfirmDialogProps) {
  const [reasonValue, setReasonValue] = useState("");
  const canConfirm = !reason || reasonValue.trim().length >= reason.minimumLength;
  const confirm = () => {
    if (!canConfirm) return;
    onConfirm(reason ? reasonValue.trim() : undefined);
    setReasonValue("");
  };
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      {...(description ? { description } : {})}
      closeLabel={closeLabel}
      footer={
        <>
          <Button onClick={() => onOpenChange(false)} variant="secondary">
            {cancelLabel}
          </Button>
          <Button disabled={!canConfirm} onClick={confirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {reason ? (
        <Textarea
          id={reason.id}
          label={reason.label}
          {...(reason.hint ? { hint: reason.hint } : {})}
          value={reasonValue}
          onChange={(event) => setReasonValue(event.currentTarget.value)}
        />
      ) : null}
    </Dialog>
  );
}
