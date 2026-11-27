import { useCallback, useRef, useState } from "react";
import { AppError } from "@noldg/api/errors";
import type { PlaybackHeartbeat, PlaybackSession } from "@noldg/api/contracts/learning";
import { closePlayback, startPlayback } from "@noldg/api/endpoints/learning";
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
  flight: { current: Promise<void> | null };
  sessionRef: { current: PlaybackSession | null };
  mounted: { current: boolean };
  lessonRef: { current: string };
  sequence: { current: number };
  position: { current: number };
  tokenRestarted: { current: boolean };
  setSession: (session: PlaybackSession | null) => void;
  setStatus: (status: PlaybackStatus) => void;
  fatalStatus: (error: unknown) => PlaybackStatus | null;
  restart: () => Promise<void>;
}

function startPlaybackOnce(lessonId: string, options: StartOptions): Promise<void> {
  if (options.flight.current) return options.flight.current;
  if (options.sessionRef.current) return Promise.resolve();
  options.setStatus("starting");
  options.flight.current = (async () => {
    try {
      const next = await startPlayback(lessonId);
      if (!options.mounted.current || options.lessonRef.current !== lessonId) {
        void closePlayback(next.sessionId, true).catch(() => undefined);
        return;
      }
      options.sessionRef.current = next;
      options.setSession(next);
      options.sequence.current = 0;
      options.position.current = next.startPositionSeconds;
      options.tokenRestarted.current = false;
      options.setStatus("paused");
    } catch (error) {
      const fatal = options.fatalStatus(error);
      if (fatal) options.setStatus(fatal);
      else if (
        error instanceof AppError &&
        error.code === "PLAYBACK_TOKEN_EXPIRED" &&
        !options.tokenRestarted.current
      ) {
        options.tokenRestarted.current = true;
        await options.restart();
      } else options.setStatus("failed");
    } finally {
      options.flight.current = null;
    }
  })();
  return options.flight.current;
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
  tokenRestarted: { current: boolean };
  closeCurrent: () => void;
  setStatus: (status: PlaybackStatus) => void;
  restartExpiredSession: () => Promise<void>;
}

async function handleHeartbeatFailure(
  error: unknown,
  lastAttempt: boolean,
  options: FailureHandlerOptions,
): Promise<boolean> {
  const fatal = options.fatalStatus(error);
  if (fatal) {
    options.closeCurrent();
    options.setStatus(fatal);
    return true;
  }
  if (
    error instanceof AppError &&
    error.code === "PLAYBACK_TOKEN_EXPIRED" &&
    !options.tokenRestarted.current
  ) {
    options.tokenRestarted.current = true;
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
  const sessionRef = useRef<PlaybackSession | null>(null);
  const currentLessonId = useRef(lessonId);
  const progressCallback = useRef(onProgress);
  const sequence = useRef(0);
  const position = useRef(0);
  const playbackRate = useRef(1);
  const playing = useRef(false);
  const mounted = useRef(false);
  const startFlight = useRef<Promise<void> | null>(null);
  const heartbeatFlight = useRef(false);
  const intervalTimer = useRef<number | undefined>(undefined);
  const retryTimer = useRef<number | undefined>(undefined);
  const retryWaitResolver = useRef<(() => void) | null>(null);
  const heartbeatController = useRef<AbortController | null>(null);
  const tokenRestarted = useRef(false);

  const clearTimers = useCallback(() => {
    if (intervalTimer.current !== undefined) window.clearInterval(intervalTimer.current);
    if (retryTimer.current !== undefined) window.clearTimeout(retryTimer.current);
    retryWaitResolver.current?.();
    retryWaitResolver.current = null;
    intervalTimer.current = undefined;
    retryTimer.current = undefined;
    heartbeatController.current?.abort();
    heartbeatController.current = null;
  }, []);
  const closeCurrent = useCallback(
    (keepalive = false) => {
      clearTimers();
      const active = sessionRef.current;
      sessionRef.current = null;
      playing.current = false;
      if (mounted.current) setSession(null);
      if (active) void closePlayback(active.sessionId, keepalive).catch(() => undefined);
    },
    [clearTimers],
  );

  const fatalStatus = useCallback((error: unknown) => isPlaybackFatal(error), []);

  const restartExpiredSession = useCallback(async () => {
    await restartExpiredPlayback(lessonId, {
      closeCurrent,
      isCurrent: () => mounted.current && currentLessonId.current === lessonId,
      onStarted: (next) => {
        sessionRef.current = next;
        setSession(next);
        sequence.current = 0;
        position.current = next.startPositionSeconds;
        setStatus("paused");
      },
      setStatus,
    });
  }, [closeCurrent, lessonId]);

  const sendHeartbeat = useCallback(
    async (options?: { force?: boolean; isPlaying?: boolean }): Promise<void> => {
      const force = options?.force === true;
      await runHeartbeatCycle({
        activeSession: sessionRef.current,
        isPlaying: () => playing.current,
        isBusy: () => heartbeatFlight.current,
        setBusy: (busy) => {
          heartbeatFlight.current = busy;
        },
        sequence: sequence.current + 1,
        force,
        playingValue: options?.isPlaying ?? true,
        isActive: (sessionId) =>
          mounted.current &&
          (force || playing.current) &&
          sessionRef.current?.sessionId === sessionId,
        getPosition: () => position.current,
        getRate: () => playbackRate.current,
        wait: (delay) =>
          new Promise<void>((resolve) => {
            retryWaitResolver.current = resolve;
            retryTimer.current = window.setTimeout(() => {
              retryTimer.current = undefined;
              retryWaitResolver.current = null;
              resolve();
            }, delay);
          }),
        setController: (controller) => {
          heartbeatController.current = controller;
        },
        onProgress: (sentSequence, result) => {
          sequence.current = sentSequence;
          progressCallback.current?.(result);
        },
        onFailure: (error, lastAttempt) =>
          handleHeartbeatFailure(error, lastAttempt, {
            fatalStatus,
            tokenRestarted,
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
        flight: startFlight,
        sessionRef,
        mounted,
        lessonRef: currentLessonId,
        sequence,
        position,
        tokenRestarted,
        setSession,
        setStatus,
        fatalStatus,
        restart: restartExpiredSession,
      }),
    [fatalStatus, lessonId, restartExpiredSession],
  );

  const mediaEvents = usePlaybackMediaEvents({
    sessionRef,
    playingRef: playing,
    positionRef: position,
    rateRef: playbackRate,
    intervalTimerRef: intervalTimer,
    controllerRef: heartbeatController,
    sendHeartbeat,
    closeCurrent,
    setStatus,
  });

  usePlaybackSessionLifecycle({
    lessonId,
    onProgress,
    currentLessonIdRef: currentLessonId,
    progressCallbackRef: progressCallback,
    mountedRef: mounted,
    closeCurrent,
  });

  return { status, session, start, ...mediaEvents, stop: closeCurrent };
}
