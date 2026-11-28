import { useCallback, useRef, useState } from "react";
import { AppError } from "@noldg/api/errors";
import type { PlaybackHeartbeat, PlaybackSession } from "@noldg/api/contracts/learning";
import { closePlayback, startPlayback } from "@noldg/api/endpoints/learning";
import { createPlaybackState, type PlaybackMutableState } from "./playback-state";
import { isPlaybackFatal, runHeartbeatCycle } from "./send-heartbeat-with-retry";
import { usePlaybackMediaEvents } from "./usePlaybackMediaEvents";
import { usePlaybackSessionLifecycle } from "./usePlaybackSessionLifecycle";

export type PlaybackStatus =
  "idle" | "starting" | "playing" | "paused" | "replaced" | "ended" | "failed";

interface RestartOptions {
  closeCurrent: () => void;
  isCurrent: () => boolean;
  onStarted: (session: PlaybackSession) => void;
  setStatus: (status: PlaybackStatus) => void;
}

interface StartOptions {
  stateRef: { current: PlaybackMutableState };
  setSession: (session: PlaybackSession | null) => void;
  setStatus: (status: PlaybackStatus) => void;
  fatalStatus: (error: unknown) => PlaybackStatus | null;
  restart: () => Promise<void>;
}

function startPlaybackOnce(lessonId: string, options: StartOptions): Promise<void> {
  const state = options.stateRef.current;
  if (state.startFlight) return state.startFlight;
  if (state.session) return Promise.resolve();
  options.setStatus("starting");
  state.startFlight = (async () => {
    try {
      const next = await startPlayback(lessonId);
      if (!state.mounted || state.lessonId !== lessonId) {
        void closePlayback(next.sessionId, true).catch(() => undefined);
        return;
      }
      state.session = next;
      options.setSession(next);
      state.sequence = 0;
      state.position = next.startPositionSeconds;
      state.tokenRestarted = false;
      options.setStatus("paused");
    } catch (error) {
      const fatal = options.fatalStatus(error);
      if (fatal) options.setStatus(fatal);
      else if (
        error instanceof AppError &&
        error.code === "PLAYBACK_TOKEN_EXPIRED" &&
        !state.tokenRestarted
      ) {
        state.tokenRestarted = true;
        await options.restart();
      } else options.setStatus("failed");
    } finally {
      state.startFlight = null;
    }
  })();
  return state.startFlight;
}

async function restartExpiredPlayback(lessonId: string, options: RestartOptions): Promise<void> {
  options.closeCurrent();
  options.setStatus("starting");
  try {
    const next = await startPlayback(lessonId);
    if (!options.isCurrent()) {
      void closePlayback(next.sessionId, true).catch(() => undefined);
      return;
    }
    options.onStarted(next);
  } catch {
    options.setStatus("failed");
  }
}

interface FailureHandlerOptions {
  fatalStatus: (error: unknown) => PlaybackStatus | null;
  stateRef: { current: PlaybackMutableState };
  closeCurrent: () => void;
  setStatus: (status: PlaybackStatus) => void;
  restartExpiredSession: () => Promise<void>;
}

async function handleHeartbeatFailure(
  error: unknown,
  lastAttempt: boolean,
  options: FailureHandlerOptions,
): Promise<boolean> {
  const state = options.stateRef.current;
  const fatal = options.fatalStatus(error);
  if (fatal) {
    options.closeCurrent();
    options.setStatus(fatal);
    return true;
  }
  if (
    error instanceof AppError &&
    error.code === "PLAYBACK_TOKEN_EXPIRED" &&
    !state.tokenRestarted
  ) {
    state.tokenRestarted = true;
    await options.restartExpiredSession();
    return true;
  }
  if (lastAttempt) {
    options.closeCurrent();
    options.setStatus("failed");
  }
  return lastAttempt;
}

/** Owns a playback session lifecycle without storing session details in query caches or URLs.
 * @param lessonId Lesson being played.
 * @param onProgress Receives server-computed progress updates.
 */
export function usePlaybackSession(
  lessonId: string,
  onProgress?: (progress: PlaybackHeartbeat) => void,
) {
  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [session, setSession] = useState<PlaybackSession | null>(null);
  const stateRef = useRef<PlaybackMutableState>(createPlaybackState(lessonId, onProgress));

  const clearTimers = useCallback(() => {
    const state = stateRef.current;
    if (state.intervalTimer !== undefined) window.clearInterval(state.intervalTimer);
    if (state.retryTimer !== undefined) window.clearTimeout(state.retryTimer);
    state.retryWaitResolver?.();
    state.retryWaitResolver = null;
    state.intervalTimer = undefined;
    state.retryTimer = undefined;
    state.heartbeatController?.abort();
    state.heartbeatController = null;
  }, []);

  const closeCurrent = useCallback(
    (keepalive = false) => {
      clearTimers();
      const state = stateRef.current;
      const active = state.session;
      state.session = null;
      state.playing = false;
      if (state.mounted) setSession(null);
      if (active) void closePlayback(active.sessionId, keepalive).catch(() => undefined);
    },
    [clearTimers],
  );

  const fatalStatus = useCallback((error: unknown) => isPlaybackFatal(error), []);

  const restartExpiredSession = useCallback(async () => {
    await restartExpiredPlayback(lessonId, {
      closeCurrent,
      isCurrent: () => stateRef.current.mounted && stateRef.current.lessonId === lessonId,
      onStarted: (next) => {
        const state = stateRef.current;
        state.session = next;
        setSession(next);
        state.sequence = 0;
        state.position = next.startPositionSeconds;
        setStatus("paused");
      },
      setStatus,
    });
  }, [closeCurrent, lessonId]);

  const sendHeartbeat = useCallback(
    async (options?: { force?: boolean; isPlaying?: boolean }): Promise<void> => {
      const state = stateRef.current;
      const force = options?.force === true;
      await runHeartbeatCycle({
        activeSession: state.session,
        isPlaying: () => state.playing,
        isBusy: () => state.heartbeatFlight,
        setBusy: (busy) => {
          state.heartbeatFlight = busy;
        },
        sequence: state.sequence + 1,
        force,
        playingValue: options?.isPlaying ?? true,
        isActive: (sessionId) =>
          state.mounted && (force || state.playing) && state.session?.sessionId === sessionId,
        getPosition: () => state.position,
        getRate: () => state.playbackRate,
        wait: (delay) =>
          new Promise<void>((resolve) => {
            state.retryWaitResolver = resolve;
            state.retryTimer = window.setTimeout(() => {
              state.retryTimer = undefined;
              state.retryWaitResolver = null;
              resolve();
            }, delay);
          }),
        setController: (controller) => {
          state.heartbeatController = controller;
        },
        onProgress: (sentSequence, result) => {
          state.sequence = sentSequence;
          state.onProgress?.(result);
        },
        onFailure: (error, lastAttempt) =>
          handleHeartbeatFailure(error, lastAttempt, {
            fatalStatus,
            stateRef,
            closeCurrent,
            setStatus,
            restartExpiredSession,
          }),
      });
    },
    [closeCurrent, fatalStatus, restartExpiredSession],
  );

  const start = useCallback(
    () =>
      startPlaybackOnce(lessonId, {
        stateRef,
        setSession,
        setStatus,
        fatalStatus,
        restart: restartExpiredSession,
      }),
    [fatalStatus, lessonId, restartExpiredSession],
  );

  const mediaEvents = usePlaybackMediaEvents({
    stateRef,
    sendHeartbeat,
    closeCurrent,
    setStatus,
  });

  usePlaybackSessionLifecycle({
    lessonId,
    onProgress,
    stateRef,
    closeCurrent,
  });

  return { status, session, start, ...mediaEvents, stop: closeCurrent };
}
