import { act, cleanup, renderHook } from "@testing-library/react";
import { http, HttpResponse, nodeServer } from "@noldg/api/mocks/testing";
import { API_BASE_URL } from "@noldg/api/constants/http";
import { afterEach, expect, it, vi } from "vitest";
import { usePlaybackSession } from "./usePlaybackSession";

const startResponse = (sessionId: string, startPositionSeconds = 35) => ({
  sessionId,
  source: {
    method: "file",
    url: "https://media.example.test/video.mp4",
    expiresAt: "2026-12-01T00:00:00.000Z",
  },
  startPositionSeconds,
  heartbeatIntervalSeconds: 10,
  watermark: { text: "" },
  serverNow: "2026-11-27T10:00:00.000Z",
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it("prevents rapid duplicate starts, resumes at the server position and sends heartbeat progress", async () => {
  let starts = 0;
  let heartbeatBody: unknown;
  nodeServer.use(
    http.post(`${API_BASE_URL}/lessons/lesson-introduction/playback`, async () => {
      starts += 1;
      return HttpResponse.json(startResponse("session-1"));
    }),
    http.post(`${API_BASE_URL}/playback/session-1/heartbeat`, async ({ request }) => {
      heartbeatBody = await request.json();
      return HttpResponse.json({
        watchedSeconds: 40,
        watchedPercent: 80,
        thresholdReached: true,
        nextHeartbeatInSeconds: 10,
        serverNow: "2026-11-27T10:00:10.000Z",
      });
    }),
  );
  const onProgress = vi.fn();
  const hook = renderHook(() => usePlaybackSession("lesson-introduction", onProgress));
  await act(async () => {
    await Promise.all([hook.result.current.start(), hook.result.current.start()]);
  });
  expect(starts).toBe(1);
  expect(hook.result.current.session?.startPositionSeconds).toBe(35);
  vi.useFakeTimers();
  act(() => hook.result.current.updateRate(5));
  act(() => hook.result.current.onPlay());
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10_000);
  });
  await vi.waitFor(() => expect(onProgress).toHaveBeenCalledOnce());
  expect(heartbeatBody).toMatchObject({
    sequence: 1,
    positionSeconds: 35,
    playbackRate: 2,
    isPlaying: true,
  });
  act(() => hook.result.current.onPause());
  expect(hook.result.current.status).toBe("paused");
});

it("retries network failures with the same sequence number", async () => {
  const sequences: number[] = [];
  let attempts = 0;
  nodeServer.use(
    http.post(`${API_BASE_URL}/lessons/lesson-introduction/playback`, () =>
      HttpResponse.json(startResponse("retry-session")),
    ),
    http.post(`${API_BASE_URL}/playback/retry-session/heartbeat`, async ({ request }) => {
      const body = (await request.json()) as { sequence: number };
      sequences.push(body.sequence);
      attempts += 1;
      if (attempts === 1) return HttpResponse.error();
      return HttpResponse.json({
        watchedSeconds: 36,
        watchedPercent: 72,
        thresholdReached: false,
        nextHeartbeatInSeconds: 10,
        serverNow: "2026-11-27T10:00:10.000Z",
      });
    }),
  );
  const hook = renderHook(() => usePlaybackSession("lesson-introduction"));
  await act(async () => hook.result.current.start());
  vi.useFakeTimers();
  act(() => hook.result.current.onPlay());
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10_000);
  });
  await vi.waitFor(() => expect(attempts).toBe(1));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });
  await vi.waitFor(() => expect(attempts).toBe(2));
  expect(sequences).toEqual([1, 1]);
});

it("restarts one expired playback token and uses the resumed server position", async () => {
  let starts = 0;
  nodeServer.use(
    http.post(`${API_BASE_URL}/lessons/lesson-introduction/playback`, () => {
      starts += 1;
      return HttpResponse.json(startResponse(`token-session-${starts}`, starts === 1 ? 35 : 42));
    }),
    http.post(`${API_BASE_URL}/playback/token-session-1/heartbeat`, () =>
      HttpResponse.json({ error: { code: "PLAYBACK_TOKEN_EXPIRED" } }, { status: 401 }),
    ),
    http.post(
      `${API_BASE_URL}/playback/token-session-2/close`,
      () => new HttpResponse(null, { status: 204 }),
    ),
  );
  const hook = renderHook(() => usePlaybackSession("lesson-introduction"));
  await act(async () => hook.result.current.start());
  vi.useFakeTimers();
  act(() => hook.result.current.onPlay());
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10_000);
  });
  await vi.waitFor(() => expect(starts).toBe(2));
  expect(hook.result.current.status).toBe("paused");
  expect(hook.result.current.session?.startPositionSeconds).toBe(42);
});

it("stops on a replaced session and closes on page hide and unmount", async () => {
  let closes = 0;
  let heartbeats = 0;
  const quickStart = { ...startResponse("replaced-session"), heartbeatIntervalSeconds: 1 };
  nodeServer.use(
    http.post(`${API_BASE_URL}/lessons/lesson-introduction/playback`, () =>
      HttpResponse.json(quickStart),
    ),
    http.post(`${API_BASE_URL}/playback/replaced-session/heartbeat`, () => {
      heartbeats += 1;
      return HttpResponse.json({ error: { code: "PLAYBACK_SESSION_REPLACED" } }, { status: 409 });
    }),
    http.post(`${API_BASE_URL}/playback/replaced-session/close`, () => {
      closes += 1;
      return new HttpResponse(null, { status: 204 });
    }),
  );
  const hook = renderHook(() => usePlaybackSession("lesson-introduction"));
  await act(async () => hook.result.current.start());
  act(() => hook.result.current.onPlay());
  await new Promise((resolve) => setTimeout(resolve, 1200));
  expect(heartbeats).toBe(1);
  await vi.waitFor(() => expect(hook.result.current.status).toBe("replaced"), { timeout: 2500 });
  const second = renderHook(() => usePlaybackSession("lesson-introduction"));
  await act(async () => second.result.current.start());
  act(() => window.dispatchEvent(new Event("pagehide")));
  await vi.waitFor(() => expect(closes).toBeGreaterThan(0));
  second.unmount();
  expect(closes).toBeGreaterThan(0);
});

it.each(["LESSON_ENDED", "LESSON_NOT_AVAILABLE"] as const)(
  "stops playback when the server returns %s",
  async (code) => {
    nodeServer.use(
      http.post(`${API_BASE_URL}/lessons/lesson-introduction/playback`, () =>
        HttpResponse.json({ ...startResponse(`fatal-${code}`), heartbeatIntervalSeconds: 1 }),
      ),
      http.post(`${API_BASE_URL}/playback/fatal-${code}/heartbeat`, () =>
        HttpResponse.json({ error: { code } }, { status: 409 }),
      ),
    );
    const hook = renderHook(() => usePlaybackSession("lesson-introduction"));
    await act(async () => hook.result.current.start());
    act(() => hook.result.current.onPlay());
    await vi.waitFor(() => expect(hook.result.current.status).toBe("ended"), { timeout: 2_500 });
  },
);

it("closes the active session when its lesson route changes", async () => {
  let closes = 0;
  nodeServer.use(
    http.post(`${API_BASE_URL}/lessons/:lessonId/playback`, ({ params }) =>
      HttpResponse.json(startResponse(`route-${String(params.lessonId)}`)),
    ),
    http.post(`${API_BASE_URL}/playback/:sessionId/close`, () => {
      closes += 1;
      return new HttpResponse(null, { status: 204 });
    }),
  );
  const hook = renderHook(({ lessonId }) => usePlaybackSession(lessonId), {
    initialProps: { lessonId: "lesson-introduction" },
  });
  await act(async () => hook.result.current.start());
  hook.rerender({ lessonId: "lesson-upcoming" });
  await vi.waitFor(() => expect(closes).toBe(1));
  hook.unmount();
  expect(closes).toBe(1);
});
