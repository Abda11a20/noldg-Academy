import type { AcademicSubject } from "@noldg/api/contracts/admin";
import { ConfirmDialog } from "@noldg/ui";

export interface SubjectConfirmationDialogProps {
  subject?: AcademicSubject | undefined;
  closeLabel: string;
  confirmLabel: string;
  cancelLabel: string;
  disableLabel: string;
  enableLabel: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/** Renders confirmation before disabling or enabling a subject.
 * @param props Optional target record, translated labels, and confirmation events.
 */
export function SubjectConfirmationDialog({
  subject,
  closeLabel,
  confirmLabel,
  cancelLabel,
  disableLabel,
  enableLabel,
  onOpenChange,
  onConfirm,
}: SubjectConfirmationDialogProps) {
  const title = subject?.active ? disableLabel : enableLabel;
  return (
    <ConfirmDialog
      open={Boolean(subject)}
      onOpenChange={onOpenChange}
      title={title}
      closeLabel={closeLabel}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      onConfirm={onConfirm}
    />
  );
}
