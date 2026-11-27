import { useState } from "react";
import { Alert, Button, Dialog, Select, TextField, Textarea } from "@noldg/ui";
import {
  QuestionInputSchema,
  type Question,
  type QuestionInput,
} from "@noldg/api/contracts/assessments";
import type { QuestionBankLabels, QuestionEditorOption } from "../types";
import { QuestionOptionsEditor } from "./QuestionOptionsEditor";

type EditorValues = {
  text: string;
  imageUrl: string;
  explanation: string;
  subjectId: string;
  lessonId: string;
  difficulty: string;
  status: "active" | "archived";
  options: QuestionEditorOption[];
  correctIndex: number;
};

export interface QuestionEditorDialogProps {
  open: boolean;
  question?: Question;
  imageFieldsEnabled: boolean;
  metadataEnabled: boolean;
  saving: boolean;
  labels: QuestionBankLabels;
  onOpenChange: (open: boolean) => void;
  onSave: (question: QuestionInput) => Promise<void>;
}

function optionalText(value?: string): string {
  return value ?? "";
}

function editorValues(question?: Question): EditorValues {
  if (!question)
    return {
      text: "",
      imageUrl: "",
      explanation: "",
      subjectId: "",
      lessonId: "",
      difficulty: "none",
      status: "active",
      options: [
        { text: "", imageUrl: "" },
        { text: "", imageUrl: "" },
      ],
      correctIndex: 0,
    };
  return {
    text: question.text,
    imageUrl: optionalText(question.imageUrl),
    explanation: optionalText(question.explanation),
    subjectId: optionalText(question.subjectId),
    lessonId: optionalText(question.lessonId),
    difficulty: question.difficulty ?? "none",
    status: question.status,
    options: question.options.map(({ text, imageUrl }) => ({
      text,
      imageUrl: optionalText(imageUrl),
    })),
    correctIndex: question.correctIndex,
  };
}

/** Edits a target MCQ and validates all option constraints before the API call.
 * @param props Existing question, feature capability flags, localized labels, and save events.
 */
export function QuestionEditorDialog({
  open,
  question,
  imageFieldsEnabled,
  metadataEnabled,
  saving,
  labels,
  onOpenChange,
  onSave,
}: QuestionEditorDialogProps) {
  const [values, setValues] = useState(() => editorValues(question));
  const [invalid, setInvalid] = useState(false);
  const updateOption = (index: number, changes: Partial<QuestionEditorOption>) =>
    setValues((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...changes } : option,
      ),
    }));
  const save = async () => {
    const parsed = QuestionInputSchema.safeParse(questionInputCandidate(values));
    if (!parsed.success) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    await onSave(parsed.data);
  };
  const removeOption = (index: number) =>
    setValues((current) => ({
      ...current,
      options: current.options.filter((_option, optionIndex) => optionIndex !== index),
      correctIndex:
        current.correctIndex >= current.options.length - 1
          ? Math.max(0, current.correctIndex - 1)
          : current.correctIndex,
    }));

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={question ? labels.editQuestion : labels.createQuestion}
      closeLabel={labels.closeDialog}
      footer={
        <>
          <Button onClick={() => onOpenChange(false)} variant="secondary">
            {labels.cancel}
          </Button>
          <Button disabled={saving} loading={saving} onClick={() => void save()}>
            {labels.saveQuestion}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {question?.used ? <Alert tone="info">{labels.usedQuestionNotice}</Alert> : null}
        {invalid ? <Alert tone="danger">{labels.validationError}</Alert> : null}
        <Textarea
          id="question-text"
          label={labels.questionText}
          required
          value={values.text}
          onChange={(event) =>
            setValues((current) => ({ ...current, text: event.currentTarget.value }))
          }
        />
        {imageFieldsEnabled ? (
          <TextField
            id="question-image-url"
            label={labels.imageUrl}
            value={values.imageUrl}
            onChange={(event) =>
              setValues((current) => ({ ...current, imageUrl: event.currentTarget.value }))
            }
          />
        ) : null}
        <QuestionOptionsEditor
          options={values.options}
          correctIndex={values.correctIndex}
          imageFieldsEnabled={imageFieldsEnabled}
          labels={labels}
          onOptionChange={updateOption}
          onOptionRemove={removeOption}
          onOptionAdd={() =>
            setValues((current) => ({
              ...current,
              options: [...current.options, { text: "", imageUrl: "" }],
            }))
          }
          onCorrectChange={(correctIndex) => setValues((current) => ({ ...current, correctIndex }))}
        />
        {metadataEnabled ? (
          <>
            <Textarea
              id="question-explanation"
              label={labels.explanation}
              value={values.explanation}
              onChange={(event) =>
                setValues((current) => ({ ...current, explanation: event.currentTarget.value }))
              }
            />
            <TextField
              id="question-subject"
              label={labels.subjectId}
              value={values.subjectId}
              onChange={(event) =>
                setValues((current) => ({ ...current, subjectId: event.currentTarget.value }))
              }
            />
            <TextField
              id="question-lesson"
              label={labels.lessonId}
              value={values.lessonId}
              onChange={(event) =>
                setValues((current) => ({ ...current, lessonId: event.currentTarget.value }))
              }
            />
            <Select
              id="question-difficulty"
              label={labels.difficultyLabel}
              value={values.difficulty}
              onValueChange={(difficulty) => setValues((current) => ({ ...current, difficulty }))}
              options={[
                { value: "none", label: labels.noDifficulty },
                { value: "easy", label: labels.easy },
                { value: "medium", label: labels.medium },
                { value: "hard", label: labels.hard },
              ]}
              placeholder={labels.difficultyLabel}
            />
          </>
        ) : null}
      </div>
    </Dialog>
  );
}

function questionInputCandidate(values: EditorValues) {
  return {
    text: values.text,
    status: values.status,
    correctIndex: values.correctIndex,
    ...(values.imageUrl ? { imageUrl: values.imageUrl } : {}),
    ...(values.explanation ? { explanation: values.explanation } : {}),
    ...(values.subjectId ? { subjectId: values.subjectId } : {}),
    ...(values.lessonId ? { lessonId: values.lessonId } : {}),
    ...(values.difficulty !== "none" ? { difficulty: values.difficulty } : {}),
    type: "multiple_choice" as const,
    options: values.options.map(({ text, imageUrl }) => ({
      text,
      ...(imageUrl ? { imageUrl } : {}),
    })),
  };
}
