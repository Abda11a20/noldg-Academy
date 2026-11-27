import type { QuestionListQuery } from "@noldg/api/contracts/assessments";

/** Creates stable cache keys for teacher question-bank queries.
 * @param query List parameters represented in the URL.
 * @returns Feature-scoped keys suitable for exact invalidation.
 */
export const questionBankQueryKeys = {
  root: ["question-bank"] as const,
  list: (query: QuestionListQuery) => ["question-bank", "list", query] as const,
  detail: (id: string) => ["question-bank", "detail", id] as const,
};
