import { useQuery } from "@tanstack/react-query";
import { getMyLessons, getStudentLesson } from "@noldg/api/endpoints/learning";
import type { MyLessonsQuery } from "@noldg/api/contracts/learning";
import { learningQueryKeys } from "../learning-query-keys";

/** Loads paginated student learning lists from the API cache.
 * @param query Validated list query from URL state.
 */
export function useMyLessons(query: MyLessonsQuery) {
  return useQuery({
    queryKey: learningQueryKeys.list(query),
    queryFn: ({ signal }) => getMyLessons(query, signal),
  });
}

/** Loads one lesson's metadata, access, and quiz availability from the API.
 * @param lessonId Opaque lesson identifier.
 */
export function useStudentLesson(lessonId: string) {
  return useQuery({
    queryKey: learningQueryKeys.detail(lessonId),
    queryFn: ({ signal }) => getStudentLesson(lessonId, signal),
    enabled: Boolean(lessonId),
  });
}
