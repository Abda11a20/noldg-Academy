import { expect, it } from "vitest";
import { MyLessonsQuerySchema, PlaybackSessionSchema, StudentLessonSchema } from "./learning";

const lesson = {
  id: "lesson-1",
  title: "Algebra",
  description: "Lesson notes",
  teacher: { id: "teacher-1", name: "Nour" },
  course: { id: "course-1", name: "Mathematics" },
  availableFrom: "2026-01-01T00:00:00.000Z",
  availableUntil: "2027-01-01T00:00:00.000Z",
  availability: "available",
  serverNow: "2026-11-27T10:00:00.000Z",
  access: "owned",
  progress: { watchedPercent: 75, thresholdReached: true, lastPositionSeconds: 30 },
  attachments: [],
  quiz: { available: true, id: "quiz-1" },
  prerequisiteLessonId: null,
};

it("validates server-owned availability and learning progress", () => {
  expect(StudentLessonSchema.parse(lesson).progress.thresholdReached).toBe(true);
  expect(StudentLessonSchema.safeParse({ ...lesson, availability: "missed" }).success).toBe(false);
});

it("validates list filters and accepts only the supported sort", () => {
  expect(
    MyLessonsQuerySchema.safeParse({ page: 1, pageSize: 20, sort: "availableUntil" }).success,
  ).toBe(true);
  expect(
    MyLessonsQuerySchema.safeParse({ page: 1, pageSize: 20, sort: "watchedPercent" }).success,
  ).toBe(false);
});

it("accepts the file source and keeps HLS represented in the target union", () => {
  const session = {
    sessionId: "session-1",
    source: {
      method: "file",
      url: "https://media.example.test/video.mp4",
      expiresAt: "2026-12-01T00:00:00.000Z",
    },
    startPositionSeconds: 12,
    heartbeatIntervalSeconds: 10,
    watermark: { text: "Student" },
    serverNow: "2026-11-27T10:00:00.000Z",
  };
  expect(PlaybackSessionSchema.parse(session).source.method).toBe("file");
  expect(
    PlaybackSessionSchema.parse({ ...session, source: { ...session.source, method: "hls" } }).source
      .method,
  ).toBe("hls");
});
