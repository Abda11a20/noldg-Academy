import { useQuery } from "@tanstack/react-query";
import {
  listCourseLessons,
  listTeacherCourses,
  listTeacherProducts,
} from "@noldg/api/endpoints/catalog";
import type { ListUrlState } from "@noldg/api/contracts/common";
import { catalogQueryKeys } from "../catalog-query-keys";

/** Loads teacher-owned course, lesson, and product data with separate list caches.
 * @param courseId Selected course for lesson and product queries.
 * @param state Validated URL-backed list state.
 */
export function useCatalogQueries(
  courseId: string | undefined,
  state: ListUrlState,
  includeCourses = true,
) {
  const courses = useQuery({
    queryKey: catalogQueryKeys.courseList(state),
    queryFn: ({ signal }) => listTeacherCourses(state, signal),
    enabled: includeCourses,
  });
  const lessons = useQuery({
    queryKey: catalogQueryKeys.lessonList(courseId ?? "none", state),
    queryFn: ({ signal }) => listCourseLessons(courseId ?? "", state, signal),
    enabled: Boolean(courseId),
  });
  const products = useQuery({
    queryKey: catalogQueryKeys.products(courseId ?? "none"),
    queryFn: ({ signal }) => listTeacherProducts(signal),
    enabled: Boolean(courseId),
  });
  return { courses, lessons, products };
}
