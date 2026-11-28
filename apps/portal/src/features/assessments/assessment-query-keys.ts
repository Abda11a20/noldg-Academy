import type { AssessmentListQuery } from "@noldg/api/contracts/assessments";

/** Stable assessment query keys for scoped invalidation of lists and details. */
export const assessmentQueryKeys = {
  root: ["assessments"] as const,
  lists: () => [...assessmentQueryKeys.root, "list"] as const,
  list: (query: AssessmentListQuery) => [...assessmentQueryKeys.lists(), query] as const,
  detail: (id: string) => [...assessmentQueryKeys.root, "detail", id] as const,
  attempts: (id: string) => [...assessmentQueryKeys.root, "attempts", id] as const,
};
