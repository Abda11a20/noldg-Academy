import type { BrowseTeacherQuery } from "@noldg/api/contracts/browse";

/** Typed keys for student browse list and detail server state. */
export const studentBrowseQueryKeys = {
  all: ["student-browse"] as const,
  lists: () => [...studentBrowseQueryKeys.all, "list"] as const,
  list: (query: BrowseTeacherQuery) => [...studentBrowseQueryKeys.lists(), query] as const,
  details: () => [...studentBrowseQueryKeys.all, "detail"] as const,
  detail: (teacherId: string) => [...studentBrowseQueryKeys.details(), teacherId] as const,
};
