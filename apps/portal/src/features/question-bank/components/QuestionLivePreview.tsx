import { Badge, Card, CardBody, Heading, Text } from "@noldg/ui";
import type { QuestionEditorOption } from "../types";

export interface QuestionLivePreviewProps {
  heading: string;
  emptyText: string;
  correctLabel: string;
  explanationLabel: string;
  text: string;
  options: readonly QuestionEditorOption[];
  correctIndex: number;
  explanation: string;
}

/** Renders a plain-text live student preview inside the question editor without HTML injection.
 * @param props Current draft question stem, options, correct option index, and localized labels.
 */
export function QuestionLivePreview({
  heading,
  emptyText,
  correctLabel,
  explanationLabel,
  text,
  options,
  correctIndex,
  explanation,
}: QuestionLivePreviewProps) {
  const filledOptions = options
    .map((option, index) => ({ text: option.text.trim(), index }))
    .filter((option) => Boolean(option.text));
  const hasContent = Boolean(text.trim() || filledOptions.length);
  return (
    <Card>
      <CardBody className="space-y-3">
        <Heading level={3}>{heading}</Heading>
        {!hasContent ? (
          <Text size="sm" tone="muted">
            {emptyText}
          </Text>
        ) : (
          <div className="space-y-2">
            {text.trim() ? <Text className="font-medium">{text.trim()}</Text> : null}
            {filledOptions.length ? (
              <ol className="space-y-1.5 ps-5">
                {filledOptions.map((option) => (
                  <li key={option.index} className="flex flex-wrap items-center gap-2">
                    <Text size="sm">{option.text}</Text>
                    {option.index === correctIndex ? (
                      <Badge tone="success">{correctLabel}</Badge>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : null}
            {explanation.trim() ? (
              <Text size="sm" tone="muted">
                {`${explanationLabel}: ${explanation.trim()}`}
              </Text>
            ) : null}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
