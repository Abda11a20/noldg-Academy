import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { capabilities } from "@noldg/api/config/capabilities";
import type { QuestionEntry, QuestionInput } from "@noldg/api/contracts/assessments";
import { createQuestion } from "@noldg/api/endpoints/questions";
import { AppError } from "@noldg/api/errors";
import { useToast } from "@noldg/ui";
import { useApiErrorToast } from "../../../shared/errors/useApiErrorToast";
import { useQuestionBankLabels } from "../hooks/useQuestionBankLabels";
import { questionBankQueryKeys } from "../question-bank-query-keys";
import { QuestionEditorDialog } from "./QuestionEditorDialog";

export interface CreateQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (question: QuestionEntry) => void;
}

/** Public cross-feature modal for creating a new target MCQ and selecting it immediately.
 * @param props Visibility controls and callback receiving the created question.
 */
export function CreateQuestionDialog({ open, onOpenChange, onCreated }: CreateQuestionDialogProps) {
  const { t } = useTranslation("questions");
  const labels = useQuestionBankLabels();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const reportError = useApiErrorToast();

  const create = useMutation({
    mutationFn: (input: QuestionInput) => createQuestion(input),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: questionBankQueryKeys.root });
      notify({ title: t("createSuccess"), tone: "success" });
      onCreated(created);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      if (error instanceof AppError && error.code === "QUESTION_INVALID") {
        notify({ title: t("validationError"), tone: "danger" });
        return;
      }
      reportError(error);
    },
  });

  const handleSave = async (input: QuestionInput): Promise<void> => {
    if (create.isPending) return;
    try {
      await create.mutateAsync(input);
    } catch {
      // Handled by mutation onError toast.
    }
  };

  return (
    <QuestionEditorDialog
      key={open ? "create-open" : "create-closed"}
      open={open}
      imageFieldsEnabled={capabilities.questionImages}
      metadataEnabled={capabilities.questionArchive}
      saving={create.isPending}
      labels={labels}
      onOpenChange={onOpenChange}
      onSave={handleSave}
    />
  );
}
