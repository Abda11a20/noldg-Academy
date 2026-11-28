import { useCallback } from "react";
import {
  DEFAULT_PLAYBACK_HEARTBEAT_SECONDS,
  PLAYBACK_RATE_MAXIMUM,
  PLAYBACK_RATE_MINIMUM,
} from "../constants";
import type { PlaybackMutableState } from "./playback-state";

interface MediaEventOptions {
  stateRef: { current: PlaybackMutableState };
  sendHeartbeat: (options?: { force?: boolean; isPlaying?: boolean }) => Promise<void>;
  closeCurrent: () => void;
  setStatus: (status: "playing" | "paused" | "ended") => void;
}

/** Connects player media events to the session heartbeat and playback state.
 * @param options Mutable session state and lifecycle callbacks for media controls.
 */
export function usePlaybackMediaEvents(options: MediaEventOptions) {
  const { stateRef, sendHeartbeat, closeCurrent, setStatus } = options;

  const onPlay = useCallback(() => {
    const state = stateRef.current;
    state.playing = true;
    setStatus("playing");
    if (state.intervalTimer !== undefined) {
      window.clearInterval(state.intervalTimer);
    }
    const interval = state.session?.heartbeatIntervalSeconds ?? DEFAULT_PLAYBACK_HEARTBEAT_SECONDS;
    state.intervalTimer = window.setInterval(() => void sendHeartbeat(), interval * 1000);
  }, [sendHeartbeat, setStatus, stateRef]);

  const onPause = useCallback(() => {
    const state = stateRef.current;
    state.playing = false;
    if (state.intervalTimer !== undefined) {
      window.clearInterval(state.intervalTimer);
    }
    state.intervalTimer = undefined;
    state.heartbeatController?.abort();
    if (state.session) {
      setStatus("paused");
      void sendHeartbeat({ force: true, isPlaying: false });
    }
  }, [sendHeartbeat, setStatus, stateRef]);

  const onEnded = useCallback(() => {
    const state = stateRef.current;
    state.playing = false;
    if (state.intervalTimer !== undefined) {
      window.clearInterval(state.intervalTimer);
    }
    state.intervalTimer = undefined;
    void (async () => {
      if (state.session) await sendHeartbeat({ force: true, isPlaying: false });
      closeCurrent();
      setStatus("ended");
    })();
  }, [closeCurrent, sendHeartbeat, setStatus, stateRef]);

  const updatePosition = useCallback(
    (value: number) => {
      stateRef.current.position = value;
    },
    [stateRef],
  );

  const updateRate = useCallback(
    (value: number) => {
      stateRef.current.playbackRate = Math.min(
        PLAYBACK_RATE_MAXIMUM,
        Math.max(PLAYBACK_RATE_MINIMUM, value),
      );
    },
    [stateRef],
  );

  return { onPlay, onPause, onEnded, updatePosition, updateRate };
}
