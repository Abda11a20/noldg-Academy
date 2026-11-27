import { http, HttpResponse } from "msw";
import {
  PlaybackHeartbeatInputSchema,
  StudentLessonListSchema,
  type StudentLesson,
} from "../../contracts/learning";
import { API_BASE_URL } from "../../constants/http";
import {
  MOCK_LEARNING_SCENARIOS,
  MOCK_LEARNING_SERVER_NOW,
  MOCK_STUDENT_LESSONS,
} from "../fixtures/learning";

let lessons = structuredClone(MOCK_STUDENT_LESSONS);
let sessionCounter = 1;
let replacementPending = true;
let tokenExpiryPending = true;
let networkHeartbeatPending = true;
const HEARTBEAT_INTERVAL_SECONDS = 10;

/** Resets lesson mock progress and active playback between API test cases. */
export function resetLearningMockState(): void {
  lessons = structuredClone(MOCK_STUDENT_LESSONS);
  sessionCounter = 1;
  replacementPending = true;
  tokenExpiryPending = true;
  networkHeartbeatPending = true;
}

function pageLessons(items: StudentLesson[], url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.max(1, Number(url.searchParams.get("pageSize") ?? 20));
  return StudentLessonListSchema.parse({
    items: items.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total: items.length,
    serverNow: MOCK_LEARNING_SERVER_NOW,
  });
}

function matchingLessons(url: URL): StudentLesson[] {
  return lessons.filter((lesson) => lessonMatchesQuery(lesson, url));
}

function findLesson(id: string): StudentLesson | undefined {
  return [...lessons, ...MOCK_LEARNING_SCENARIOS].find((lesson) => lesson.id === id);
}

function getSessionId(id: string): string {
  if (id === "lesson-session-replaced" && replacementPending) return "session-replaced-first";
  if (id === "lesson-token-expired" && tokenExpiryPending) return "token-expired-first";
  if (id === "lesson-network-heartbeat") return "network-failure-session";
  if (id === "lesson-out-of-order") return "out-of-order-session";
  if (id === "lesson-rate-rejected") return "rate-rejected-session";
  return `playback-session-${sessionCounter++}`;
}

function matchesFilter(value: string | null, actual: string): boolean {
  return !value || value === actual;
}

function matchesSearch(lesson: StudentLesson, search: string | undefined): boolean {
  return !search || lesson.title.toLowerCase().includes(search);
}

function lessonMatchesQuery(lesson: StudentLesson, url: URL): boolean {
  return (
    matchesFilter(url.searchParams.get("availability"), lesson.availability) &&
    matchesFilter(url.searchParams.get("teacherId"), lesson.teacher.id) &&
    matchesFilter(url.searchParams.get("courseId"), lesson.course.id) &&
    matchesSearch(lesson, url.searchParams.get("q")?.toLowerCase())
  );
}

export const learningHandlers = [
  http.get(
    "https://media.example.test/lesson.mp4",
    () => new HttpResponse(new Uint8Array(), { headers: { "content-type": "video/webm" } }),
  ),
  http.get(
    "https://media.example.test/gallery.mp4",
    () => new HttpResponse(new Uint8Array(), { headers: { "content-type": "video/mp4" } }),
  ),
  http.get(`${API_BASE_URL}/me/lessons`, ({ request }) => {
    const url = new URL(request.url);
    const scenario = url.searchParams.get("scenario");
    if (scenario === "network") return HttpResponse.error();
    if (scenario === "forbidden")
      return HttpResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    return HttpResponse.json(pageLessons(matchingLessons(url), url));
  }),
  http.get(`${API_BASE_URL}/me/lessons/:lessonId`, ({ params }) => {
    const lesson = findLesson(String(params.lessonId));
    if (!lesson) return HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    return HttpResponse.json(lesson);
  }),
  http.post(`${API_BASE_URL}/lessons/:lessonId/playback`, ({ params }) => {
    const id = String(params.lessonId);
    const lesson = findLesson(id);
    if (!lesson || lesson.availability === "ended")
      return HttpResponse.json({ error: { code: "LESSON_ENDED" } }, { status: 409 });
    if (lesson.availability !== "available")
      return HttpResponse.json({ error: { code: "LESSON_NOT_AVAILABLE" } }, { status: 409 });
    if (lesson.access !== "owned")
      return HttpResponse.json({ error: { code: "LESSON_NOT_OWNED" } }, { status: 403 });
    const sessionId = getSessionId(id);
    return HttpResponse.json({
      sessionId,
      source: {
        method: "file",
        url: "https://media.example.test/lesson.mp4",
        expiresAt: "2026-11-28T10:00:00.000Z",
      },
      startPositionSeconds: lesson.progress.lastPositionSeconds,
      heartbeatIntervalSeconds: HEARTBEAT_INTERVAL_SECONDS,
      watermark: { text: "Student • 01012345678" },
      serverNow: MOCK_LEARNING_SERVER_NOW,
    });
  }),
  http.post(`${API_BASE_URL}/playback/:sessionId/heartbeat`, async ({ params, request }) => {
    const parsed = PlaybackHeartbeatInputSchema.safeParse(await request.json());
    if (!parsed.success)
      return HttpResponse.json({ error: { code: "VALIDATION_ERROR" } }, { status: 400 });
    const sessionId = String(params.sessionId);
    if (sessionId.includes("out-of-order"))
      return HttpResponse.json({ error: { code: "HEARTBEAT_OUT_OF_ORDER" } }, { status: 409 });
    if (sessionId.includes("rate-rejected"))
      return HttpResponse.json({ error: { code: "PLAYBACK_RATE_REJECTED" } }, { status: 400 });
    if (sessionId.includes("replaced")) replacementPending = false;
    if (sessionId.includes("replaced"))
      return HttpResponse.json({ error: { code: "PLAYBACK_SESSION_REPLACED" } }, { status: 409 });
    if (sessionId.includes("token-expired") && tokenExpiryPending) {
      tokenExpiryPending = false;
      return HttpResponse.json({ error: { code: "PLAYBACK_TOKEN_EXPIRED" } }, { status: 401 });
    }
    if (sessionId.includes("network-failure") && networkHeartbeatPending) {
      networkHeartbeatPending = false;
      return HttpResponse.error();
    }
    const body = parsed.data;
    const percent = Math.min(100, Math.floor(body.positionSeconds));
    return HttpResponse.json({
      watchedSeconds: body.positionSeconds,
      watchedPercent: percent,
      thresholdReached: percent >= 75,
      nextHeartbeatInSeconds: HEARTBEAT_INTERVAL_SECONDS,
      serverNow: MOCK_LEARNING_SERVER_NOW,
    });
  }),
  http.post(
    `${API_BASE_URL}/playback/:sessionId/close`,
    () => new HttpResponse(null, { status: 204 }),
  ),
  http.get(`${API_BASE_URL}/lessons/:lessonId/attachments/:attachmentId/download`, ({ params }) => {
    if (params.attachmentId === "attachment-failure")
      return HttpResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 503 });
    return HttpResponse.json({ url: "https://media.example.test/notes.pdf" });
  }),
];
