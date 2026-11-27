import { useCallback } from "react";
import type { PlaybackSession } from "@noldg/api/contracts/learning";
import {
  DEFAULT_PLAYBACK_HEARTBEAT_SECONDS,
  PLAYBACK_RATE_MAXIMUM,
  PLAYBACK_RATE_MINIMUM,
} from "../constants";

interface MediaEventOptions {
  sessionRef: { current: PlaybackSession | null };
  playingRef: { current: boolean };
  positionRef: { current: number };
  rateRef: { current: number };
  intervalTimerRef: { current: number | undefined };
  controllerRef: { current: AbortController | null };
  sendHeartbeat: (options?: { force?: boolean; isPlaying?: boolean }) => Promise<void>;
  closeCurrent: () => void;
  setStatus: (status: "playing" | "paused" | "ended") => void;
}

/** Connects player media events to the session heartbeat and playback state.
 * @param options Mutable session state and lifecycle callbacks for media controls.
 */
export function usePlaybackMediaEvents(options: MediaEventOptions) {
  const {
    sessionRef,
    playingRef,
    positionRef,
    rateRef,
    intervalTimerRef,
    controllerRef,
    sendHeartbeat,
    closeCurrent,
    setStatus,
  } = options;
  const onPlay = useCallback(() => {
    playingRef.current = true;
    setStatus("playing");
    if (intervalTimerRef.current !== undefined) {
      window.clearInterval(intervalTimerRef.current);
    }
    const interval =
      sessionRef.current?.heartbeatIntervalSeconds ?? DEFAULT_PLAYBACK_HEARTBEAT_SECONDS;
    intervalTimerRef.current = window.setInterval(() => void sendHeartbeat(), interval * 1000);
  }, [intervalTimerRef, playingRef, sendHeartbeat, sessionRef, setStatus]);

  const onPause = useCallback(() => {
    playingRef.current = false;
    if (intervalTimerRef.current !== undefined) {
      window.clearInterval(intervalTimerRef.current);
    }
    intervalTimerRef.current = undefined;
    controllerRef.current?.abort();
    if (sessionRef.current) {
      setStatus("paused");
      void sendHeartbeat({ force: true, isPlaying: false });
    }
  }, [controllerRef, intervalTimerRef, playingRef, sendHeartbeat, sessionRef, setStatus]);

  const onEnded = useCallback(() => {
    playingRef.current = false;
    if (intervalTimerRef.current !== undefined) {
      window.clearInterval(intervalTimerRef.current);
    }
    intervalTimerRef.current = undefined;
    void (async () => {
      if (sessionRef.current) await sendHeartbeat({ force: true, isPlaying: false });
      closeCurrent();
      setStatus("ended");
    })();
  }, [closeCurrent, intervalTimerRef, playingRef, sendHeartbeat, sessionRef, setStatus]);

  const updatePosition = useCallback(
    (value: number) => {
      positionRef.current = value;
    },
    [positionRef],
  );

  const updateRate = useCallback(
    (value: number) => {
      rateRef.current = Math.min(PLAYBACK_RATE_MAXIMUM, Math.max(PLAYBACK_RATE_MINIMUM, value));
    },
    [rateRef],
  );

  return { onPlay, onPause, onEnded, updatePosition, updateRate };
}
