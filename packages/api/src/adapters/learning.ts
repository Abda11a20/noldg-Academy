import {
  LegacyHeartbeatResponseSchema,
  LegacyLessonProgressSchema,
  LegacyPlaybackAccessSchema,
  LegacyPlaybackStartedSchema,
  PlaybackHeartbeatSchema,
  PlaybackSessionSchema,
} from "../contracts/learning";
import { AppError } from "../errors/app-error";
import { LEGACY_HEARTBEAT_INTERVAL_SECONDS } from "../constants/learning";

function invalidLegacyResponse(): AppError {
  return new AppError({
    code: "RESPONSE_VALIDATION_FAILED",
    status: 502,
    message_key: "errors:invalidResponse",
  });
}

/** Adapts the current direct-file playback response into the target source union.
 * @param started Current playback-session creation response data.
 * @param access Current lesson access response data.
 */
export function adaptLegacyPlaybackSession(started: unknown, access: unknown) {
  const startedResult = LegacyPlaybackStartedSchema.safeParse(started);
  const accessResult = LegacyPlaybackAccessSchema.safeParse(access);
  if (!startedResult.success || !accessResult.success) throw invalidLegacyResponse();
  const serverNow =
    startedResult.data.session.lastHeartbeatAt ?? startedResult.data.session.createdAt;
  if (!serverNow) throw invalidLegacyResponse();
  return PlaybackSessionSchema.parse({
    sessionId: startedResult.data.session.id,
    source: {
      method: "file",
      url: accessResult.data.video.url,
      expiresAt: accessResult.data.mediaExpiresAt,
    },
    startPositionSeconds: startedResult.data.session.lastPosition ?? 0,
    heartbeatIntervalSeconds:
      startedResult.data.heartbeatIntervalSeconds ?? LEGACY_HEARTBEAT_INTERVAL_SECONDS,
    watermark: { text: "" },
    serverNow,
  });
}

/** Adapts server-calculated legacy progress fields; never calculates watched time client-side.
 * @param response Current heartbeat response data.
 * @param previousServerNow Most recent server timestamp from the active session, when omitted by the response.
 */
export function adaptLegacyHeartbeat(response: unknown, previousServerNow: string) {
  const parsed = LegacyHeartbeatResponseSchema.safeParse(response);
  if (!parsed.success) throw invalidLegacyResponse();
  return PlaybackHeartbeatSchema.parse({
    watchedSeconds: parsed.data.progress.watchedSeconds,
    watchedPercent: parsed.data.progress.watchedPercentage,
    thresholdReached: parsed.data.progress.completed,
    nextHeartbeatInSeconds: LEGACY_HEARTBEAT_INTERVAL_SECONDS,
    serverNow: parsed.data.serverNow ?? previousServerNow,
  });
}

/** Adapts the backend's lesson progress summary without calculating its completion state.
 * @param response Current GET lesson progress response data.
 */
export function adaptLegacyLessonProgress(response: unknown) {
  const parsed = LegacyLessonProgressSchema.safeParse(response);
  if (!parsed.success) throw invalidLegacyResponse();
  return {
    watchedPercent: parsed.data.watchedPercentage,
    thresholdReached: parsed.data.completed,
    lastPositionSeconds: parsed.data.lastPosition,
  };
}
