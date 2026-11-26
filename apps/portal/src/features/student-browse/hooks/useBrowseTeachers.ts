import { useQuery } from "@tanstack/react-query";
import type { BrowseTeacherQuery } from "@noldg/api/contracts/browse";
import { listBrowseTeachers } from "@noldg/api/endpoints/catalog";
import { studentBrowseQueryKeys } from "../student-browse-query-keys";

/** Loads a cancellable paginated teacher list using the typed browse query key. */
export function useBrowseTeachers(query: BrowseTeacherQuery) {
  return useQuery({
    queryKey: studentBrowseQueryKeys.list(query),
    queryFn: ({ signal }) => listBrowseTeachers(query, signal),
  });
}
