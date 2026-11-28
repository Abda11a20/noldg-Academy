import { useQuery } from "@tanstack/react-query";
import { getAssessmentAttempt, listAssessmentAttempts } from "@noldg/api/endpoints/assessments";
import type { AssessmentAttemptListQuery } from "@noldg/api/contracts/assessments";
import { assessmentQueryKeys } from "../assessment-query-keys";

/** Loads server-computed assessment result summaries with URL-derived filters.
 * @param assessmentId Assessment identifier.
 * @param query Validated paging, search, and suspicious-attempt filters.
 */
export function useAssessmentResults(
  assessmentId: string,
  query: AssessmentAttemptListQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: assessmentQueryKeys.attempts(assessmentId, query),
    queryFn: ({ signal }) => listAssessmentAttempts(assessmentId, query, signal),
    enabled,
  });
}

/** Loads one attempt's frozen questions and server-provided choices and answers.
 * @param assessmentId Assessment identifier.
 * @param attemptId Student attempt identifier.
 * @param enabled Whether the detail route is active.
 */
export function useAssessmentAttempt(assessmentId: string, attemptId: string, enabled: boolean) {
  return useQuery({
    queryKey: assessmentQueryKeys.attempt(assessmentId, attemptId),
    queryFn: ({ signal }) => getAssessmentAttempt(assessmentId, attemptId, signal),
    enabled,
  });
}
