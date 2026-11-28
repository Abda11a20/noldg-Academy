import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { AppError } from "@noldg/api/errors";
import { Alert, Skeleton } from "@noldg/ui";
import { useAssessmentAttempt } from "../hooks/useAssessmentResults";
import { AssessmentAttemptContent } from "../components/AssessmentAttemptContent";

function getAttemptErrorKey(error: unknown): "forbidden" | "notFound" | "loadError" {
  if (!(error instanceof AppError)) return "loadError";
  if (error.status === 403) return "forbidden";
  if (error.status === 404) return "notFound";
  return "loadError";
}

/** Displays one student's frozen assessment attempt and server grading.
 * @returns Loading, permission, error, or attempt detail state.
 */
export function AssessmentAttemptDetailPage() {
  const { t, i18n } = useTranslation("assessments");
  const { t: tErrors } = useTranslation("errors");
  const { courseId = "", assessmentId = "", attemptId = "" } = useParams();
  const query = useAssessmentAttempt(assessmentId, attemptId, Boolean(assessmentId && attemptId));
  if (query.isPending) return <Skeleton height="lg" />;
  if (query.isError) {
    const errorKey = getAttemptErrorKey(query.error);
    return (
      <Alert tone="danger" role="alert">
        {errorKey === "forbidden"
          ? tErrors("forbidden")
          : t(errorKey === "notFound" ? "assessmentNotFound" : "loadError")}
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
