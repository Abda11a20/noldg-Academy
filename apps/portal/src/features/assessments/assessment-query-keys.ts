import type {
  AssessmentAttemptListQuery,
  AssessmentListQuery,
} from "@noldg/api/contracts/assessments";

/** Stable assessment query keys for scoped invalidation of lists and details. */
export const assessmentQueryKeys = {
  root: ["assessments"] as const,
  lists: () => [...assessmentQueryKeys.root, "list"] as const,
  list: (query: AssessmentListQuery) => [...assessmentQueryKeys.lists(), query] as const,
  detail: (id: string) => [...assessmentQueryKeys.root, "detail", id] as const,
  students: (courseId: string) => [...assessmentQueryKeys.root, "students", courseId] as const,
  attempts: (id: string, query: AssessmentAttemptListQuery) =>
    [...assessmentQueryKeys.root, "attempts", id, query] as const,
  attempt: (assessmentId: string, attemptId: string) =>
    [...assessmentQueryKeys.root, "attempt", assessmentId, attemptId] as const,
};
