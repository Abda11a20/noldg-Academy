import { useEffect } from "react";
import type { PlaybackHeartbeat } from "@noldg/api/contracts/learning";
import type { PlaybackMutableState } from "./playback-state";

interface SessionLifecycleOptions {
  lessonId: string;
  onProgress: ((progress: PlaybackHeartbeat) => void) | undefined;
  stateRef: { current: PlaybackMutableState };
  closeCurrent: (keepalive?: boolean) => void;
}

/** Keeps session callbacks current and closes active playback on hide or unmount.
 * @param options Lesson identity, progress callback state, and close behavior.
 */
export function usePlaybackSessionLifecycle(options: SessionLifecycleOptions): void {
  const { lessonId, onProgress, stateRef, closeCurrent } = options;

  useEffect(() => {
    stateRef.current.onProgress = onProgress;
    stateRef.current.lessonId = lessonId;
  }, [lessonId, onProgress, stateRef]);

  useEffect(() => {
    const state = stateRef.current;
    state.mounted = true;
    const onPageHide = () => closeCurrent(true);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      state.mounted = false;
      window.removeEventListener("pagehide", onPageHide);
      closeCurrent(true);
    };
  }, [closeCurrent, lessonId, stateRef]);
}
