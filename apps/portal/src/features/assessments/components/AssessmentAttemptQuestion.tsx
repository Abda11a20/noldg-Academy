import { useTranslation } from "react-i18next";
import type { AssessmentAttemptDetail } from "@noldg/api/contracts/assessments";
import { Heading, Text } from "@noldg/ui";

interface AssessmentAttemptQuestionProps {
  question: AssessmentAttemptDetail["questions"][number]["question"];
  selectedIndex: number | null;
  index: number;
}

/** Displays one frozen multiple-choice question with the submitted and correct choices.
 * @param props Frozen question data and its zero-based display index.
 */
export function AssessmentAttemptQuestion(props: AssessmentAttemptQuestionProps) {
  const { t } = useTranslation("assessments");
  return (
    <li className="space-y-3 rounded-lg border border-border p-4">
      <Heading level={3}>{t("attemptQuestion", { number: props.index + 1 })}</Heading>
      <Text>{props.question.text}</Text>
      <ul className="space-y-2">
        {props.question.options.map((option, optionIndex) => (
          <li
            key={`${props.question.id}-${optionIndex}`}
            className="flex flex-wrap items-center gap-2 rounded-md bg-surface-muted p-3"
          >
            <Text>{option.text}</Text>
            {props.selectedIndex === optionIndex ? (
              <Text size="sm">{t("studentChoice")}</Text>
            ) : null}
            {props.question.correctIndex === optionIndex ? (
              <Text size="sm">{t("correctChoice")}</Text>
            ) : null}
          </li>
        ))}
      </ul>
    </li>
  );
}
