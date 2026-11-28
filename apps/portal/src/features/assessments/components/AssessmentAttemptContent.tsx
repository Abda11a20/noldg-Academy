import { useTranslation } from "react-i18next";
import type { AssessmentAttemptDetail } from "@noldg/api/contracts/assessments";
import { Breadcrumbs, Heading, Text } from "@noldg/ui";
import { getTeacherCoursePath } from "../../../shared/navigation/routes";
import { getTeacherAssessmentResultsPath } from "../routes";
import { formatNumber } from "../../../shared/i18n/formatting";
import { formatCairoDateTime } from "../../../shared/time/time";
import { AssessmentAttemptQuestion } from "./AssessmentAttemptQuestion";

interface AssessmentAttemptContentProps {
  courseId: string;
  assessmentId: string;
  attempt: AssessmentAttemptDetail;
  language: string;
}

/** Renders frozen attempt answers and server-provided grading information.
 * @param props Route identifiers, server attempt, and active language.
 */
export function AssessmentAttemptContent(props: AssessmentAttemptContentProps) {
  const { t } = useTranslation("assessments");
  return (
    <section className="space-y-5">
      <Breadcrumbs
        label={t("breadcrumbs")}
        items={[
          { label: t("course"), to: getTeacherCoursePath(props.courseId) },
          {
            label: t("resultsTitle"),
            to: getTeacherAssessmentResultsPath(props.courseId, props.assessmentId),
          },
          { label: props.attempt.student.name },
        ]}
      />
      <Heading level={1}>{t("attemptDetailTitle", { name: props.attempt.student.name })}</Heading>
      <div className="flex flex-wrap gap-4">
        <Text>
          {t("scoreValue", {
            score:
              props.attempt.score === null ? t("notSubmitted") : formatNumber(props.attempt.score),
            total: formatNumber(props.attempt.total),
          })}
        </Text>
        <Text>
          {t("startedAt", {
            value: formatCairoDateTime(props.attempt.startedAt, props.language),
          })}
        </Text>
        <Text>
          {t("submittedAt", {
            value: props.attempt.submittedAt
              ? formatCairoDateTime(props.attempt.submittedAt, props.language)
              : t("notSubmitted"),
          })}
        </Text>
      </div>
      <ol className="space-y-4">
        {props.attempt.questions.map((question, index) => (
          <AssessmentAttemptQuestion key={question.question.id} {...question} index={index} />
        ))}
      </ol>
    </section>
  );
}
