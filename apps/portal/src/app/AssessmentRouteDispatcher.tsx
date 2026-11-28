import { Suspense, lazy } from "react";
import { useParams } from "react-router";
import { Skeleton } from "@noldg/ui";

const AssessmentBuilderPage = lazy(async () => ({
  default: (await import("../features/assessments")).AssessmentBuilderPage,
}));
const AssessmentResultsPage = lazy(async () => ({
  default: (await import("../features/assessments")).AssessmentResultsPage,
}));
const AssessmentAttemptDetailPage = lazy(async () => ({
  default: (await import("../features/assessments")).AssessmentAttemptDetailPage,
}));

/** Selects the assessment view from the matched lightweight route parameters.
 * @returns The lazily loaded builder, results, or attempt details page.
 */
export function AssessmentRouteDispatcher() {
  const { assessmentId, action, attemptId } = useParams();
  const isBuilder = (assessmentId === "new" && Boolean(action)) || action === "edit";
  const Page = isBuilder
    ? AssessmentBuilderPage
    : attemptId
      ? AssessmentAttemptDetailPage
      : AssessmentResultsPage;
  return (
    <Suspense fallback={<Skeleton height="lg" />}>
      <Page />
    </Suspense>
  );
}
