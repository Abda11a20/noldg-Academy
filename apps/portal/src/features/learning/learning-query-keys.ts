import type { MyLessonsQuery } from "@noldg/api/contracts/learning";

/** Builds isolated list and detail cache keys for student learning data. */
export const learningQueryKeys = {
  all: ["learning"] as const,
  lists: () => [...learningQueryKeys.all, "list"] as const,
  list: (query: MyLessonsQuery) => [...learningQueryKeys.lists(), query] as const,
  details: () => [...learningQueryKeys.all, "detail"] as const,
  detail: (lessonId: string) => [...learningQueryKeys.details(), lessonId] as const,
};
