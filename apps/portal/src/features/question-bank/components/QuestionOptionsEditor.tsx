import { Button, Select, TextField } from "@noldg/ui";
import { QUESTION_OPTION_MAX, QUESTION_OPTION_MIN } from "../constants";
import type { QuestionBankLabels, QuestionEditorOption } from "../types";

export interface QuestionOptionsEditorProps {
  options: readonly QuestionEditorOption[];
  correctIndex: number;
  imageFieldsEnabled: boolean;
  labels: QuestionBankLabels;
  onOptionChange: (index: number, changes: Partial<QuestionEditorOption>) => void;
  onOptionRemove: (index: number) => void;
  onOptionAdd: () => void;
  onCorrectChange: (index: number) => void;
}

/** Edits MCQ options and the single correct answer using labelled shared controls.
 * @param props Option state, feature support, labels, and controlled field events.
 */
export function QuestionOptionsEditor({
  options,
  correctIndex,
  imageFieldsEnabled,
  labels,
  onOptionChange,
  onOptionRemove,
  onOptionAdd,
  onCorrectChange,
}: QuestionOptionsEditorProps) {
  const correctOptions = options.map((_option, index) => ({
    value: String(index),
    label: labels.option.replace("{{number}}", String(index + 1)),
  }));
  return (
    <div className="space-y-4">
      {options.map((option, index) => (
        <div className="flex items-end gap-2" key={`option-${index}`}>
          <div className="min-w-0 flex-1 space-y-2">
            <TextField
              id={`question-option-${index}`}
              label={labels.option.replace("{{number}}", String(index + 1))}
              required
              value={option.text}
              onChange={(event) => onOptionChange(index, { text: event.currentTarget.value })}
            />
            {imageFieldsEnabled ? (
              <TextField
                id={`question-option-image-${index}`}
                label={labels.optionImageUrl.replace("{{number}}", String(index + 1))}
                value={option.imageUrl}
                onChange={(event) => onOptionChange(index, { imageUrl: event.currentTarget.value })}
              />
            ) : null}
          </div>
          <Button
            aria-label={labels.removeOption.replace("{{number}}", String(index + 1))}
            disabled={options.length <= QUESTION_OPTION_MIN}
            iconOnly
            iconStart="minus"
            onClick={() => onOptionRemove(index)}
            variant="ghost"
          />
        </div>
      ))}
      <Button
        disabled={options.length >= QUESTION_OPTION_MAX}
        iconStart="plus"
        onClick={onOptionAdd}
        variant="secondary"
      >
        {labels.addOption}
      </Button>
      <Select
        id="question-correct-index"
        label={labels.correctOption}
        value={String(correctIndex)}
        onValueChange={(value) => onCorrectChange(Number(value))}
        options={correctOptions}
        placeholder={labels.correctOption}
      />
    </div>
  );
}
