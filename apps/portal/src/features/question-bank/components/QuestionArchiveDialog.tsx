import { ConfirmDialog } from "@noldg/ui";
import type { Question } from "@noldg/api/contracts/assessments";
import type { QuestionBankLabels } from "../types";

export interface QuestionArchiveDialogProps {
  target: { question: Question; action: "archive" | "restore" } | undefined;
  labels: QuestionBankLabels;
  onClose: () => void;
  onConfirm: () => void;
}

/** Confirms archiving or restoring a bank question and explains used-question safety.
 * @param props Selected question/action, localized text, and dialog events.
 */
export function QuestionArchiveDialog({
  target,
  labels,
  onClose,
  onConfirm,
}: QuestionArchiveDialogProps) {
  const restoring = target?.action === "restore";
  return (
    <ConfirmDialog
      open={Boolean(target)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={restoring ? labels.restoreQuestion : labels.archiveQuestion}
      description={target?.question.used ? labels.usedQuestionNotice : labels.archiveConfirm}
      closeLabel={labels.closeDialog}
      confirmLabel={restoring ? labels.restoreQuestion : labels.archiveQuestion}
      cancelLabel={labels.cancel}
      onConfirm={onConfirm}
    />
  );
}
