import { beforeEach, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { API_BASE_URL } from "../../constants/http";
import { AppError } from "../../errors/app-error";
import { MOCK_LEARNING_SERVER_NOW, MOCK_STUDENT_LESSONS } from "../../mocks/fixtures/learning";
import { resetLearningMockState } from "../../mocks/handlers/learning";
import { nodeServer } from "../../mocks/node";
import {
  closePlayback,
  getAttachmentDownload,
  getLessonProgress,
  getMyLessons,
  getStudentLesson,
  sendPlaybackHeartbeat,
  startPlayback,
} from "./index";

beforeEach(resetLearningMockState);

it("serializes list filters and returns server-owned availability and progress", async () => {
  let requestUrl: URL | undefined;
  nodeServer.use(
    http.get(`${API_BASE_URL}/me/lessons`, ({ request }) => {
      requestUrl = new URL(request.url);
      return HttpResponse.json({
        items: [MOCK_STUDENT_LESSONS[0]],
        page: 2,
        pageSize: 10,
        total: 11,
        serverNow: MOCK_LEARNING_SERVER_NOW,
      });
    }),
  );
  const result = await getMyLessons({
    page: 2,
    pageSize: 10,
    availability: "available",
    teacherId: "teacher-nour",
    courseId: "course-general-secondary-1",
    search: "algebra",
    sort: "availableUntil",
  });
  expect(requestUrl?.searchParams.get("availability")).toBe("available");
  expect(requestUrl?.searchParams.get("teacherId")).toBe("teacher-nour");
  expect(requestUrl?.searchParams.get("courseId")).toBe("course-general-secondary-1");
  expect(requestUrl?.searchParams.get("q")).toBe("algebra");
  expect(result.items[0]?.availability).toBe("available");
  expect(result.items[0]?.progress.watchedPercent).toBe(70);
});

it("filters and paginates the target mock lessons list", async () => {
  const result = await getMyLessons({
    page: 1,
    pageSize: 2,
    availability: "available",
    teacherId: "teacher-nour",
    search: "algebra",
    sort: "availableUntil",
  });
  expect(result.items).toHaveLength(1);
  expect(result.items[0]?.teacher.id).toBe("teacher-nour");
  expect(result.total).toBe(1);
  expect(result.serverNow).toBe(MOCK_LEARNING_SERVER_NOW);
});

it("normalizes list network and forbidden responses", async () => {
  nodeServer.use(
    http.get(`${API_BASE_URL}/me/lessons`, () =>
      HttpResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 }),
    ),
  );
  await expect(getMyLessons({ page: 1, pageSize: 20 })).rejects.toMatchObject({
    status: 403,
    code: "FORBIDDEN",
  });
  nodeServer.use(http.get(`${API_BASE_URL}/me/lessons`, () => HttpResponse.error()));
  await expect(getMyLessons({ page: 1, pageSize: 20 })).rejects.toMatchObject({
    status: 0,
    code: "NETWORK_ERROR",
  });
});

it("loads lesson metadata and normalizes a missing lesson", async () => {
  const result = await getStudentLesson("lesson-introduction");
  expect(result.attachments[0]?.id).toBe("attachment-notes");
  await expect(getStudentLesson("unknown-lesson")).rejects.toMatchObject({ status: 404 });
});

it("reads legacy progress through the authenticated learning route", async () => {
  nodeServer.use(
    http.get(`${API_BASE_URL}/learning/lessons/lesson-introduction/progress`, () =>
      HttpResponse.json({
        watchedPercentage: 72,
        lastPosition: 50,
        completed: false,
        watchedRanges: [],
      }),
    ),
  );
  await expect(getLessonProgress("lesson-introduction")).resolves.toEqual({
    watchedPercent: 72,
    thresholdReached: false,
    lastPositionSeconds: 50,
  });
});

it.each([
  ["lesson-introduction", "paused"],
  ["lesson-not-owned", "LESSON_NOT_OWNED"],
  ["lesson-upcoming", "LESSON_NOT_AVAILABLE"],
  ["lesson-ended", "LESSON_ENDED"],
  ["lesson-session-replaced", "paused"],
  ["lesson-token-expired", "paused"],
] as const)("starts or rejects a playback session for %s", async (lessonId, expected) => {
  if (expected === "paused") {
    const session = await startPlayback(lessonId);
    expect(session).toMatchObject({
      sessionId: expect.any(String),
      source: { method: "file" },
      startPositionSeconds: 35,
      heartbeatIntervalSeconds: 10,
    });
  } else {
    await expect(startPlayback(lessonId)).rejects.toMatchObject({ code: expected });
  }
});

it("maps heartbeat progress from the server and closes the session", async () => {
  const session = await startPlayback("lesson-introduction");
  const progress = await sendPlaybackHeartbeat(session.sessionId, {
    sequence: 1,
    positionSeconds: 78,
    playbackRate: 1.5,
    isPlaying: true,
  });
  expect(progress).toMatchObject({
    watchedPercent: 78,
    thresholdReached: true,
    serverNow: MOCK_LEARNING_SERVER_NOW,
  });
  await closePlayback(session.sessionId);
});

it.each(["out-of-order", "rate-rejected", "replaced"] as const)(
  "normalizes fatal heartbeat scenario %s",
  async (scenario) => {
    await expect(
      sendPlaybackHeartbeat(`session-${scenario}`, {
        sequence: 1,
        positionSeconds: 0,
        playbackRate: 1,
        isPlaying: true,
      }),
    ).rejects.toBeInstanceOf(AppError);
  },
);

it("runs session-replaced, expired-token, and network-retry mock scenarios", async () => {
  const replaced = await startPlayback("lesson-session-replaced");
  await expect(
    sendPlaybackHeartbeat(replaced.sessionId, {
      sequence: 1,
      positionSeconds: 36,
      playbackRate: 1,
      isPlaying: true,
    }),
  ).rejects.toMatchObject({ code: "PLAYBACK_SESSION_REPLACED" });
  const replacement = await startPlayback("lesson-session-replaced");
  expect(replacement.sessionId).not.toBe(replaced.sessionId);

  const expired = await startPlayback("lesson-token-expired");
  await expect(
    sendPlaybackHeartbeat(expired.sessionId, {
      sequence: 1,
      positionSeconds: 36,
      playbackRate: 1,
      isPlaying: true,
    }),
  ).rejects.toMatchObject({ code: "PLAYBACK_TOKEN_EXPIRED" });
  expect((await startPlayback("lesson-token-expired")).sessionId).not.toBe(expired.sessionId);

  const network = await startPlayback("lesson-network-heartbeat");
  const heartbeat = { sequence: 1, positionSeconds: 36, playbackRate: 1, isPlaying: true };
  await expect(sendPlaybackHeartbeat(network.sessionId, heartbeat)).rejects.toMatchObject({
    code: "NETWORK_ERROR",
  });
  await expect(sendPlaybackHeartbeat(network.sessionId, heartbeat)).resolves.toMatchObject({
    watchedSeconds: 36,
  });
});

it("obtains an attachment URL on demand and normalizes provider errors", async () => {
  expect(await getAttachmentDownload("lesson-introduction", "attachment-notes")).toContain(
    "notes.pdf",
  );
  await expect(
    getAttachmentDownload("lesson-introduction", "attachment-failure"),
  ).rejects.toMatchObject({ status: 503 });
});
