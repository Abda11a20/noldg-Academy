import type { UserSummary } from "@noldg/api/contracts/admin";
import { ADMIN_REASON_MIN_LENGTH } from "@noldg/api/constants/admin";
import { ConfirmDialog } from "@noldg/ui";

export interface TeacherAccountStatusDialogProps {
  account?: UserSummary | undefined;
  title: string;
  closeLabel: string;
  confirmLabel: string;
  cancelLabel: string;
  reasonLabel: string;
  reasonHint: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

/** Requires a minimum reason before changing a teacher account's state.
 * @param props Selected account, localized dialog labels, and events.
 */
export function TeacherAccountStatusDialog({
  account,
  title,
  closeLabel,
  confirmLabel,
  cancelLabel,
  reasonLabel,
  reasonHint,
  onOpenChange,
  onConfirm,
}: TeacherAccountStatusDialogProps) {
  return (
    <ConfirmDialog
      open={Boolean(account)}
      onOpenChange={onOpenChange}
      title={title}
      closeLabel={closeLabel}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      reason={{
        id: "account-status-reason",
        label: reasonLabel,
        hint: reasonHint,
        minimumLength: ADMIN_REASON_MIN_LENGTH,
      }}
      onConfirm={(reason) => {
        if (reason) onConfirm(reason);
      }}
    />
  );
}
