import { useQuery } from "@tanstack/react-query";
import { getBrowseTeacher } from "@noldg/api/endpoints/catalog";
import { studentBrowseQueryKeys } from "../student-browse-query-keys";

/** Loads one cancellable teacher profile and its capability-supported previews. */
export function useBrowseTeacher(teacherId: string) {
  return useQuery({
    queryKey: studentBrowseQueryKeys.detail(teacherId),
    queryFn: ({ signal }) => getBrowseTeacher(teacherId, signal),
    enabled: Boolean(teacherId),
  });
}
