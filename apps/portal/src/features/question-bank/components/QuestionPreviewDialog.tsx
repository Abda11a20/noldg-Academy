import { Badge, Button, Dialog, Text } from "@noldg/ui";
import type { Question } from "@noldg/api/contracts/assessments";

export interface QuestionPreviewDialogProps {
  question: Question | undefined;
  onClose: () => void;
  labels: {
    title: string;
    close: string;
    correct: string;
    explanation: string;
  };
}

/** Shows a question exactly as plain text with its answer marked for teacher preview.
 * @param props Selected question, close event, and localized presentation labels.
 */
export function QuestionPreviewDialog({ question, onClose, labels }: QuestionPreviewDialogProps) {
  if (!question) return null;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={labels.title}
      closeLabel={labels.close}
      footer={
        <Button onClick={onClose} variant="secondary">
          {labels.close}
        </Button>
      }
    >
      <div className="space-y-3">
        <Text>{question.text}</Text>
        <ol className="list-inside list-decimal space-y-2">
          {question.options.map((option, index) => (
            <li className="text-foreground" key={`${question.id}-${index}`}>
              {option.text}{" "}
              {index === question.correctIndex ? (
                <Badge tone="success">{labels.correct}</Badge>
              ) : null}
            </li>
          ))}
        </ol>
        {question.explanation ? (
          <p className="text-foreground-muted">
            <strong>{labels.explanation}</strong> {question.explanation}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}
