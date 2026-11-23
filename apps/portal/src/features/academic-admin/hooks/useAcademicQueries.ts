import { useQuery } from "@tanstack/react-query";
import { listSubjects, listTracks, listTrackSubjects } from "@noldg/api/endpoints/admin";
import type { ListUrlState } from "@noldg/api/contracts/common";
import { academicQueryKeys } from "../academic-query-keys";

/** Provides the academic lists and selected track mapping through cached server queries.
 * @param state Validated URL-backed page and filters.
 * @param trackId Selected mapping track, if any.
 */
export function useAcademicQueries(state: ListUrlState, trackId?: string) {
  const tracks = useQuery({
    queryKey: academicQueryKeys.trackList(state),
    queryFn: () => listTracks(state, state.filters),
  });
  const subjects = useQuery({
    queryKey: academicQueryKeys.subjectList(state),
    queryFn: () => listSubjects(state),
  });
  const trackSubjects = useQuery({
    queryKey: academicQueryKeys.trackSubjects(trackId ?? "none"),
    queryFn: () => listTrackSubjects(trackId ?? ""),
    enabled: Boolean(trackId),
  });
  return { tracks, subjects, trackSubjects };
}
