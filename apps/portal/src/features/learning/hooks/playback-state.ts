import type { PlaybackHeartbeat, PlaybackSession } from "@noldg/api/contracts/learning";

/** Mutable state shared across playback session helpers without forcing re-renders. */
export interface PlaybackMutableState {
  session: PlaybackSession | null;
  lessonId: string;
  onProgress: ((progress: PlaybackHeartbeat) => void) | undefined;
  sequence: number;
  position: number;
  playbackRate: number;
  playing: boolean;
  mounted: boolean;
  startFlight: Promise<void> | null;
  heartbeatFlight: boolean;
  intervalTimer: number | undefined;
  retryTimer: number | undefined;
  retryWaitResolver: (() => void) | null;
  heartbeatController: AbortController | null;
  tokenRestarted: boolean;
}

/** Creates the initial mutable state for a playback session hook instance. */
export function createPlaybackState(
  lessonId: string,
  onProgress: ((progress: PlaybackHeartbeat) => void) | undefined,
): PlaybackMutableState {
  return {
    session: null,
    lessonId,
    onProgress,
    sequence: 0,
    position: 0,
    playbackRate: 1,
    playing: false,
    mounted: false,
    startFlight: null,
    heartbeatFlight: false,
    intervalTimer: undefined,
    retryTimer: undefined,
    retryWaitResolver: null,
    heartbeatController: null,
    tokenRestarted: false,
  };
}
