import { beforeAll, beforeEach, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { API_BASE_URL } from "../../constants/http";
import { nodeServer } from "../../mocks/node";
import type * as LearningApi from "./index";

let learningApi: typeof LearningApi;

beforeAll(async () => {
  vi.stubEnv("VITE_API_MODE", "live");
  vi.stubEnv("VITE_LEARNING_MY_LESSONS", "true");
  vi.stubEnv("VITE_LEARNING_ATTACHMENTS", "true");
  learningApi = await import("./index");
});

beforeEach(() => {
  nodeServer.resetHandlers();
});

it("adapts legacy playback start, heartbeat, close, progress, and attachment responses", async () => {
  const requests: string[] = [];
  nodeServer.use(
    http.get(`${API_BASE_URL}/learning/lessons/lesson-legacy/progress`, () =>
      HttpResponse.json({
        success: true,
        data: { watchedPercentage: 50, lastPosition: 60, completed: false, watchedRanges: [] },
      }),
    ),
    http.post(`${API_BASE_URL}/learning/playback-sessions`, async ({ request }) => {
      requests.push(`${request.method} ${new URL(request.url).pathname}`);
      return HttpResponse.json({
        success: true,
        data: {
          session: {
            id: "session-legacy",
            lastPosition: 33,
            createdAt: "2026-11-27T10:00:00.000Z",
          },
          heartbeatIntervalSeconds: 12,
        },
      });
    }),
    http.get(`${API_BASE_URL}/lessons/lesson-legacy/access`, ({ request }) => {
      requests.push(`GET ${new URL(request.url).pathname}${new URL(request.url).search}`);
      return HttpResponse.json({
        success: true,
        data: {
          video: { url: "https://media.example.test/video.mp4" },
          mediaExpiresAt: "2026-11-27T11:00:00.000Z",
        },
      });
    }),
    http.patch(
      `${API_BASE_URL}/learning/playback-sessions/session-legacy/heartbeat`,
      async ({ request }) => {
        requests.push(`${request.method} ${new URL(request.url).pathname}`);
        return HttpResponse.json({
          success: true,
          data: { progress: { watchedSeconds: 60, watchedPercentage: 50, completed: false } },
        });
      },
    ),
    http.patch(`${API_BASE_URL}/learning/playback-sessions/session-legacy/close`, ({ request }) => {
      requests.push(`${request.method} ${new URL(request.url).pathname}`);
      return new HttpResponse(null, { status: 204 });
    }),
    http.get(`${API_BASE_URL}/lessons/lesson-legacy/attachments/file-legacy/download`, () =>
      HttpResponse.json({
        success: true,
        data: { url: "https://media.example.test/attachment.pdf" },
      }),
    ),
  );

  await expect(learningApi.getLessonProgress("lesson-legacy")).resolves.toEqual({
    watchedPercent: 50,
    thresholdReached: false,
    lastPositionSeconds: 60,
  });
  const session = await learningApi.startPlayback("lesson-legacy");
  expect(session).toMatchObject({
    sessionId: "session-legacy",
    startPositionSeconds: 33,
    heartbeatIntervalSeconds: 12,
    source: { method: "file" },
  });
  await expect(
    learningApi.sendPlaybackHeartbeat(session.sessionId, {
      sequence: 1,
      positionSeconds: 60,
      playbackRate: 1,
      isPlaying: true,
    }),
  ).resolves.toMatchObject({
    watchedSeconds: 60,
    watchedPercent: 50,
    serverNow: "2026-11-27T10:00:00.000Z",
  });
  await learningApi.closePlayback(session.sessionId, true);
  await expect(
    learningApi.getAttachmentDownload("lesson-legacy", "file-legacy"),
  ).resolves.toContain("attachment.pdf");
  expect(requests).toContain("GET /api/lessons/lesson-legacy/access?sessionId=session-legacy");
  expect(requests).toContain("PATCH /api/learning/playback-sessions/session-legacy/close");
});

it("rejects capabilities that are not implemented by the current backend", async () => {
  await expect(learningApi.getStudentLesson("lesson-legacy")).rejects.toMatchObject({
    status: 501,
    code: "CAPABILITY_UNAVAILABLE",
  });
  vi.stubEnv("VITE_LEARNING_ATTACHMENTS", "false");
  vi.resetModules();
  const liveApi = await import("./index");
  await expect(liveApi.getAttachmentDownload("lesson-legacy", "file-legacy")).rejects.toMatchObject(
    { status: 501, code: "CAPABILITY_UNAVAILABLE" },
  );
});

it("fails closed when a live heartbeat has no known session server timestamp", async () => {
  nodeServer.use(
    http.patch(`${API_BASE_URL}/learning/playback-sessions/untracked/heartbeat`, () =>
      HttpResponse.json({
        success: true,
        data: { progress: { watchedSeconds: 1, watchedPercentage: 1, completed: false } },
      }),
    ),
  );
  await expect(
    learningApi.sendPlaybackHeartbeat("untracked", {
      sequence: 1,
      positionSeconds: 1,
      playbackRate: 1,
      isPlaying: true,
    }),
  ).rejects.toMatchObject({ status: 501, code: "CAPABILITY_UNAVAILABLE" });
});

it("rejects malformed legacy playback session envelopes", async () => {
  nodeServer.use(
    http.post(`${API_BASE_URL}/learning/playback-sessions`, () =>
      HttpResponse.json({ success: true, data: { session: { id: 42 } } }),
    ),
  );
  await expect(learningApi.startPlayback("lesson-legacy")).rejects.toMatchObject({
    status: 501,
    code: "CAPABILITY_UNAVAILABLE",
  });
});

it("normalizes a malformed legacy attachment response", async () => {
  nodeServer.use(
    http.get(`${API_BASE_URL}/lessons/lesson-legacy/attachments/file-legacy/download`, () =>
      HttpResponse.json({ success: true, data: { url: 42 } }),
    ),
  );
  await expect(
    learningApi.getAttachmentDownload("lesson-legacy", "file-legacy"),
  ).rejects.toMatchObject({ status: 502, code: "RESPONSE_VALIDATION_FAILED" });
});
