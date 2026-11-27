import { expect, it } from "vitest";
import {
  adaptLegacyHeartbeat,
  adaptLegacyLessonProgress,
  adaptLegacyPlaybackSession,
} from "./learning";

it("adapts the backend's direct-download playback contract into a file source", () => {
  const session = adaptLegacyPlaybackSession(
    {
      session: { id: "session-1", lastPosition: 42, lastHeartbeatAt: "2026-11-27T10:00:00.000Z" },
      heartbeatIntervalSeconds: 10,
    },
    {
      video: { url: "https://media.example.test/signed.mp4" },
      mediaExpiresAt: "2026-11-27T11:00:00.000Z",
    },
  );
  expect(session).toMatchObject({
    sessionId: "session-1",
    source: { method: "file" },
    startPositionSeconds: 42,
    serverNow: "2026-11-27T10:00:00.000Z",
    watermark: { text: "" },
  });
});

it("rejects an invalid legacy response with the normalized error model", () => {
  expect(() => adaptLegacyPlaybackSession({}, {})).toThrow(
    expect.objectContaining({ status: 502, code: "RESPONSE_VALIDATION_FAILED" }),
  );
});

it("adapts only server-computed watched progress and completion fields", () => {
  const heartbeat = adaptLegacyHeartbeat(
    { progress: { watchedSeconds: 60, watchedPercentage: 40, completed: false } },
    "2026-11-27T10:00:00.000Z",
  );
  expect(heartbeat).toMatchObject({
    watchedSeconds: 60,
    watchedPercent: 40,
    thresholdReached: false,
    serverNow: "2026-11-27T10:00:00.000Z",
  });
  const completed = adaptLegacyHeartbeat(
    {
      progress: { watchedSeconds: 150, watchedPercentage: 100, completed: true },
      serverNow: "2026-11-27T10:00:10.000Z",
    },
    "2026-11-27T10:00:00.000Z",
  );
  expect(completed.thresholdReached).toBe(true);
  expect(completed.serverNow).toBe("2026-11-27T10:00:10.000Z");
});

it("rejects heartbeat data that cannot fulfill the target response", () => {
  expect(() =>
    adaptLegacyHeartbeat(
      { progress: { watchedSeconds: 1, watchedPercentage: 1 } },
      "2026-11-27T10:00:00.000Z",
    ),
  ).toThrow(expect.objectContaining({ status: 502, code: "RESPONSE_VALIDATION_FAILED" }));
});

it("adapts server-calculated lesson progress without client-side completion thresholds", () => {
  expect(
    adaptLegacyLessonProgress({ watchedPercentage: 73, lastPosition: 94, completed: false }),
  ).toEqual({
    watchedPercent: 73,
    thresholdReached: false,
    lastPositionSeconds: 94,
  });
  expect(
    adaptLegacyLessonProgress({ watchedPercentage: 100, lastPosition: 120, completed: true })
      .thresholdReached,
  ).toBe(true);
});
