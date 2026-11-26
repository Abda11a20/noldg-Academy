import { useSearchParams } from "react-router";
import { useAuthSnapshot } from "../../../shared/auth/auth-store";
import { STUDENT_BROWSE_TRACKS } from "../constants";

const TRACK_QUERY_KEY = "trackId";

/** Uses the profile track when present, otherwise restores and updates a manual track in the URL. */
export function useStudentTrack() {
  const profileTrack = useAuthSnapshot().user?.trackId;
  const [params, setParams] = useSearchParams();
  const selectedTrack = params.get(TRACK_QUERY_KEY);
  const manualTrack = STUDENT_BROWSE_TRACKS.some(({ id }) => id === selectedTrack)
    ? (selectedTrack ?? undefined)
    : undefined;
  const trackId = profileTrack ?? manualTrack;

  function setTrack(nextTrack: string): void {
    const nextParams = new URLSearchParams(params);
    if (STUDENT_BROWSE_TRACKS.some(({ id }) => id === nextTrack))
      nextParams.set(TRACK_QUERY_KEY, nextTrack);
    else nextParams.delete(TRACK_QUERY_KEY);
    setParams(nextParams);
  }

  return { trackId, manual: !profileTrack, setTrack };
}
