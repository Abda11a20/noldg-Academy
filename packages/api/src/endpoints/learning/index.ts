import { HttpsUrlSchema } from "../../contracts/common";
import {
  MyLessonsQuerySchema,
  PlaybackHeartbeatInputSchema,
  PlaybackHeartbeatSchema,
  PlaybackSessionSchema,
  StartPlaybackInputSchema,
  StudentLessonListSchema,
  StudentLessonSchema,
  type MyLessonsQuery,
} from "../../contracts/learning";
import { capabilities } from "../../config/capabilities";
import { AppError } from "../../errors/app-error";
import {
  adaptLegacyHeartbeat,
  adaptLegacyLessonProgress,
  adaptLegacyPlaybackSession,
} from "../../adapters/learning";
import { request } from "../../http/client";
import { apiMode } from "../../mocks/mode";
import { signalOption, unknownResponseSchema } from "../catalog/common";

const liveSessionServerTimes = new Map<string, string>();

function extractData(payload: unknown): unknown {
  if (typeof payload !== "object" || payload === null || !("data" in payload)) return payload;
  return payload.data;
}

function unavailable(): AppError {
  return new AppError({
    code: "CAPABILITY_UNAVAILABLE",
    status: 501,
    message_key: "errors:capabilityUnavailable",
  });
}

function requireLearningCapability(enabled: boolean): void {
  if (apiMode === "live" && !enabled) throw unavailable();
}

function listQuery(query: MyLessonsQuery): string {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.availability) params.set("availability", query.availability);
  if (query.teacherId) params.set("teacherId", query.teacherId);
  if (query.courseId) params.set("courseId", query.courseId);
  if (query.search) params.set("q", query.search);
  if (query.sort) params.set("sort", query.sort);
  return `?${params.toString()}`;
}

/** Lists the student's lessons with server-owned availability and progress.
 * @param query Validated URL-backed filters.
 * @param signal Optional cancellation signal.
 */
export async function getMyLessons(query: MyLessonsQuery, signal?: AbortSignal) {
  const values = MyLessonsQuerySchema.parse(query);
  requireLearningCapability(capabilities.myLessonsList);
  const payload = await request(
    `me/lessons${listQuery(values)}`,
    unknownResponseSchema,
    signalOption(signal),
  );
  return StudentLessonListSchema.parse(extractData(payload));
}

/** Gets server-owned lesson access, metadata, progress, and quiz availability.
 * @param lessonId Lesson identifier.
 * @param signal Optional cancellation signal.
 */
export async function getStudentLesson(lessonId: string, signal?: AbortSignal) {
  requireLearningCapability(capabilities.studentLessonDetail);
  const payload = await request(
    `me/lessons/${encodeURIComponent(lessonId)}`,
    unknownResponseSchema,
    signalOption(signal),
  );
  return StudentLessonSchema.parse(extractData(payload));
}

/** Gets server-calculated lesson progress independently of lesson metadata.
 * @param lessonId Lesson identifier.
 * @param signal Optional cancellation signal.
 */
export async function getLessonProgress(lessonId: string, signal?: AbortSignal) {
  requireLearningCapability(capabilities.lessonProgressApi);
  const payload = await request(
    `learning/lessons/${encodeURIComponent(lessonId)}/progress`,
    unknownResponseSchema,
    signalOption(signal),
  );
  return adaptLegacyLessonProgress(extractData(payload));
}

/** Starts the one active playback session allowed for the student.
 * @param lessonId Lesson identifier.
 */
export async function startPlayback(lessonId: string) {
  StartPlaybackInputSchema.parse({ lessonId });
  requireLearningCapability(capabilities.playbackSessionApi);
  if (apiMode === "mock") {
    const payload = await request(
      `lessons/${encodeURIComponent(lessonId)}/playback`,
      unknownResponseSchema,
      {
        method: "POST",
        body: {},
      },
    );
    return PlaybackSessionSchema.parse(extractData(payload));
  }
  const startedPayload = await request("learning/playback-sessions", unknownResponseSchema, {
    method: "POST",
    body: { lessonId },
  });
  const started = extractData(startedPayload);
  if (typeof started !== "object" || started === null || !("session" in started))
    throw unavailable();
  const session = started.session;
  if (
    typeof session !== "object" ||
    session === null ||
    !("id" in session) ||
    typeof session.id !== "string"
  )
    throw unavailable();
  const accessPayload = await request(
    `lessons/${encodeURIComponent(lessonId)}/access?sessionId=${encodeURIComponent(session.id)}`,
    unknownResponseSchema,
  );
  const adapted = adaptLegacyPlaybackSession(started, extractData(accessPayload));
  liveSessionServerTimes.set(adapted.sessionId, adapted.serverNow);
  return adapted;
}

/** Sends one playback position sample; the server alone credits watched time.
 * @param sessionId Active playback session.
 * @param input Sequence, position, rate, and play state.
 */
export async function sendPlaybackHeartbeat(
  sessionId: string,
  input: unknown,
  signal?: AbortSignal,
) {
  requireLearningCapability(capabilities.playbackSessionApi);
  const values = PlaybackHeartbeatInputSchema.parse(input);
  const path =
    apiMode === "live"
      ? `learning/playback-sessions/${encodeURIComponent(sessionId)}/heartbeat`
      : `playback/${encodeURIComponent(sessionId)}/heartbeat`;
  const payload = await request(path, unknownResponseSchema, {
    method: apiMode === "live" ? "PATCH" : "POST",
    body: values,
    ...signalOption(signal),
  });
  const data = extractData(payload);
  if (apiMode === "live") {
    const previousServerNow = liveSessionServerTimes.get(sessionId);
    if (!previousServerNow) throw unavailable();
    return adaptLegacyHeartbeat(data, previousServerNow);
  }
  return PlaybackHeartbeatSchema.parse(data);
}

/** Closes a session after leaving playback.
 * @param sessionId Active playback session.
 * @param keepalive Allows close-on-page-hide to finish during navigation.
 */
export async function closePlayback(sessionId: string, keepalive = false): Promise<void> {
  requireLearningCapability(capabilities.playbackSessionApi);
  const path =
    apiMode === "live"
      ? `learning/playback-sessions/${encodeURIComponent(sessionId)}/close`
      : `playback/${encodeURIComponent(sessionId)}/close`;
  await request(path, unknownResponseSchema, {
    method: apiMode === "live" ? "PATCH" : "POST",
    ...(keepalive ? { keepalive: true } : {}),
  });
  liveSessionServerTimes.delete(sessionId);
}

/** Gets a short-lived attachment URL from the server.
 * @param lessonId Lesson identifier.
 * @param attachmentId Attachment identifier.
 */
export async function getAttachmentDownload(lessonId: string, attachmentId: string) {
  requireLearningCapability(capabilities.attachmentDownload);
  const payload = await request(
    `lessons/${encodeURIComponent(lessonId)}/attachments/${encodeURIComponent(attachmentId)}/download`,
    unknownResponseSchema,
  );
  const data = extractData(payload);
  const rawUrl = typeof data === "object" && data !== null && "url" in data ? data.url : undefined;
  const parsedUrl = HttpsUrlSchema.safeParse(rawUrl);
  if (!parsedUrl.success)
    throw new AppError({
      code: "RESPONSE_VALIDATION_FAILED",
      status: 502,
      message_key: "errors:invalidResponse",
    });
  return parsedUrl.data;
}
