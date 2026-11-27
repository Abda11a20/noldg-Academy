import { AppError } from "@noldg/api/errors";
import type { PlaybackHeartbeat, PlaybackSession } from "@noldg/api/contracts/learning";
import { sendPlaybackHeartbeat } from "@noldg/api/endpoints/learning";
import {
  PLAYBACK_RATE_MAXIMUM,
  PLAYBACK_RATE_MINIMUM,
  PLAYBACK_RETRY_DELAYS_MS,
} from "../constants";

interface HeartbeatOptions {
  session: PlaybackSession;
  sequence: number;
  positionSeconds: number;
  playbackRate: number;
  signal: AbortSignal;
}

interface RetryContext {
  activeSession: PlaybackSession;
  nextSequence: number;
  isActive: () => boolean;
  getPosition: () => number;
  getRate: () => number;
  wait: (delay: number) => Promise<void>;
  onSuccess: (sequence: number, result: PlaybackHeartbeat) => void;
  onFailure: (error: unknown, lastAttempt: boolean) => Promise<boolean>;
  setController: (controller: AbortController | null) => void;
}

interface HeartbeatCycleOptions {
  activeSession: PlaybackSession | null;
  isPlaying: () => boolean;
  isBusy: () => boolean;
  setBusy: (busy: boolean) => void;
  sequence: number;
  isActive: (sessionId: string) => boolean;
  getPosition: () => number;
  getRate: () => number;
  wait: (delay: number) => Promise<void>;
  setController: (controller: AbortController | null) => void;
  onProgress: (sequence: number, result: PlaybackHeartbeat) => void;
  onFailure: (error: unknown, lastAttempt: boolean) => Promise<boolean>;
}

async function attemptHeartbeat(options: HeartbeatOptions): Promise<PlaybackHeartbeat> {
  return sendPlaybackHeartbeat(
    options.session.sessionId,
    {
      sequence: options.sequence,
      positionSeconds: options.positionSeconds,
      playbackRate: Math.min(
        PLAYBACK_RATE_MAXIMUM,
        Math.max(PLAYBACK_RATE_MINIMUM, options.playbackRate),
      ),
      isPlaying: true,
    },
    options.signal,
  );
}

/** Retries one heartbeat without advancing its sequence until the server accepts it.
 * @param context Active session state and callbacks for success, failure, and abort handling.
 * @returns Resolves when the heartbeat succeeds or retry handling reaches a terminal state.
 */
async function sendHeartbeatWithRetry(context: RetryContext): Promise<void> {
  const sequence = context.nextSequence;
  for (let attempt = 0; attempt <= PLAYBACK_RETRY_DELAYS_MS.length; attempt += 1) {
    if (attempt > 0) {
      await context.wait(PLAYBACK_RETRY_DELAYS_MS[attempt - 1]!);
      if (!context.isActive()) return;
    }
    const controller = new AbortController();
    context.setController(controller);
    try {
      const result = await attemptHeartbeat({
        session: context.activeSession,
        sequence,
        positionSeconds: context.getPosition(),
        playbackRate: context.getRate(),
        signal: controller.signal,
      });
      context.onSuccess(sequence, result);
      return;
    } catch (error) {
      const lastAttempt = attempt === PLAYBACK_RETRY_DELAYS_MS.length;
      const handled = await context.onFailure(error, lastAttempt);
      if (handled || lastAttempt) return;
    } finally {
      context.setController(null);
    }
  }
}

/** Sends one heartbeat cycle and keeps retries on the same sequence number.
 * @param options Session state and side-effect callbacks for heartbeat handling.
 */
export async function runHeartbeatCycle(options: HeartbeatCycleOptions): Promise<void> {
  const active = options.activeSession;
  if (!active || !options.isPlaying() || options.isBusy()) return;
  options.setBusy(true);
  try {
    await sendHeartbeatWithRetry({
      activeSession: active,
      nextSequence: options.sequence,
      isActive: () => options.isActive(active.sessionId),
      getPosition: options.getPosition,
      getRate: options.getRate,
      wait: options.wait,
      setController: options.setController,
      onSuccess: options.onProgress,
      onFailure: options.onFailure,
    });
  } finally {
    options.setBusy(false);
  }
}

/** Returns the fatal playback state represented by a server error.
 * @param error Request failure from playback endpoints.
 */
export function isPlaybackFatal(error: unknown): "replaced" | "ended" | null {
  if (!(error instanceof AppError)) return null;
  if (error.code === "PLAYBACK_SESSION_REPLACED") return "replaced";
  if (error.code === "LESSON_ENDED" || error.code === "LESSON_NOT_AVAILABLE") return "ended";
  return null;
}
