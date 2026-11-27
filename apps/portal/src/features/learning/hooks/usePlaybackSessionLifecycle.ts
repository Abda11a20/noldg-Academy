import { useEffect } from "react";
import type { PlaybackHeartbeat } from "@noldg/api/contracts/learning";

interface SessionLifecycleOptions {
  lessonId: string;
  onProgress: ((progress: PlaybackHeartbeat) => void) | undefined;
  currentLessonIdRef: { current: string };
  progressCallbackRef: { current: ((progress: PlaybackHeartbeat) => void) | undefined };
  mountedRef: { current: boolean };
  closeCurrent: (keepalive?: boolean) => void;
}

/** Keeps session callbacks current and closes active playback on hide or unmount.
 * @param options Lesson identity, progress callback refs, and close behavior.
 */
export function usePlaybackSessionLifecycle(options: SessionLifecycleOptions): void {
  const {
    lessonId,
    onProgress,
    currentLessonIdRef,
    progressCallbackRef,
    mountedRef,
    closeCurrent,
  } = options;
  useEffect(() => {
    progressCallbackRef.current = onProgress;
    currentLessonIdRef.current = lessonId;
  }, [currentLessonIdRef, lessonId, onProgress, progressCallbackRef]);

  useEffect(() => {
    mountedRef.current = true;
    const onPageHide = () => closeCurrent(true);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      mountedRef.current = false;
      window.removeEventListener("pagehide", onPageHide);
      closeCurrent(true);
    };
  }, [closeCurrent, lessonId, mountedRef]);
}
