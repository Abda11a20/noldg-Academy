import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { capabilities } from "@noldg/api/config/capabilities";
import { AppError } from "@noldg/api/errors";
import { Alert, Skeleton } from "@noldg/ui";
import { useAssessmentAttempt } from "../hooks/useAssessmentResults";
import { AssessmentAttemptContent } from "../components/AssessmentAttemptContent";

function resolveAttemptError(
  error: unknown,
  t: (key: "assessmentNotFound" | "loadError") => string,
  tErrors: (key: "forbidden") => string,
): string {
  if (error instanceof AppError && error.status === 403) return tErrors("forbidden");
  if (error instanceof AppError && error.status === 404) return t("assessmentNotFound");
  return t("loadError");
}

/** Displays one student's frozen assessment attempt and server grading.
 * @returns Loading, permission, error, or attempt detail state.
 */
export function AssessmentAttemptDetailPage() {
  const { t, i18n } = useTranslation("assessments");
  const { t: tErrors } = useTranslation("errors");
  const params = useParams();
  const courseId = params.courseId ?? "";
  const assessmentId = params.assessmentId ?? "";
  const attemptId = params.attemptId ?? "";
  const enabled = Boolean(assessmentId && attemptId && capabilities.assessmentResultsApi);
  const query = useAssessmentAttempt(assessmentId, attemptId, enabled);
  if (!capabilities.assessmentResultsApi)
    return <Alert tone="info">{t("resultsUnavailable")}</Alert>;
  if (query.isPending) return <Skeleton height="lg" />;
  if (query.isError) {
    return (
      <Alert tone="danger" role="alert">
        {resolveAttemptError(query.error, t, tErrors)}
      </Alert>
    );
  }
  return (
    <AssessmentAttemptContent
      courseId={courseId}
      assessmentId={assessmentId}
      attempt={query.data}
      language={i18n.language}
    />
  );
}
