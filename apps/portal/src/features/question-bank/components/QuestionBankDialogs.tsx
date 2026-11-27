import { useState, type ReactNode } from "react";
import type { Question, QuestionInput } from "@noldg/api/contracts/assessments";
import { capabilities } from "@noldg/api/config/capabilities";
import { QuestionEditorDialog } from "./QuestionEditorDialog";
import { QuestionPreviewDialog } from "./QuestionPreviewDialog";
import { QuestionArchiveDialog } from "./QuestionArchiveDialog";
import type { QuestionBankLabels } from "../types";
import { useQuestions } from "../hooks/useQuestions";

interface QuestionDialogActions {
  onCreate: () => void;
  onEdit: (question: Question) => void;
  onPreview: (question: Question) => void;
  onArchive: (question: Question, action: "archive" | "restore") => void;
}

export interface QuestionBankDialogsProps {
  questions: ReturnType<typeof useQuestions>;
  labels: QuestionBankLabels;
  children: (actions: QuestionDialogActions) => ReactNode;
}

/** Coordinates question editing, preview, and archive confirmations.
 * @param props Question queries/mutations, translated copy, and list renderer.
 */
export function QuestionBankDialogs({ questions, labels, children }: QuestionBankDialogsProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | undefined>();
  const [previewQuestion, setPreviewQuestion] = useState<Question | undefined>();
  const [archiveTarget, setArchiveTarget] = useState<{
    question: Question;
    action: "archive" | "restore";
  }>();
  const closeEditor = () => {
    setEditorOpen(false);
    setEditingQuestion(undefined);
  };
  const saveQuestion = async (input: QuestionInput) => {
    try {
      if (editingQuestion) await questions.update.mutateAsync({ id: editingQuestion.id, input });
      else await questions.create.mutateAsync(input);
      closeEditor();
    } catch {
      // Mutation hooks already report normalized errors through the central toast handler.
    }
  };
  const confirmArchive = async () => {
    if (!archiveTarget) return;
    try {
      const mutation = archiveTarget.action === "archive" ? questions.archive : questions.restore;
      await mutation.mutateAsync(archiveTarget.question.id);
      setArchiveTarget(undefined);
    } catch {
      // Mutation hooks already report normalized errors through the central toast handler.
    }
  };
  const actions: QuestionDialogActions = {
    onCreate: () => {
      setEditingQuestion(undefined);
      setEditorOpen(true);
    },
    onEdit: (question) => {
      setEditingQuestion(question);
      setEditorOpen(true);
    },
    onPreview: setPreviewQuestion,
    onArchive: (question, action) => setArchiveTarget({ question, action }),
  };
  return (
    <>
      {children(actions)}
      {editorOpen ? (
        <QuestionEditorDialog
          key={editingQuestion?.id ?? "new-question"}
          open
          {...(editingQuestion ? { question: editingQuestion } : {})}
          imageFieldsEnabled={capabilities.questionImages}
          metadataEnabled={capabilities.questionMetadata}
          saving={questions.create.isPending || questions.update.isPending}
          labels={labels}
          onOpenChange={(open) => {
            if (!open) closeEditor();
          }}
          onSave={saveQuestion}
        />
      ) : null}
      <QuestionPreviewDialog
        question={previewQuestion}
        onClose={() => setPreviewQuestion(undefined)}
        labels={{
          title: labels.previewQuestion,
          close: labels.closeDialog,
          correct: labels.correctAnswerLabel,
          explanation: labels.explanation,
        }}
      />
      <QuestionArchiveDialog
        target={archiveTarget}
        labels={labels}
        onClose={() => setArchiveTarget(undefined)}
        onConfirm={() => void confirmArchive()}
      />
    </>
  );
}
