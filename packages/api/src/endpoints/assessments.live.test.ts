import { afterEach, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { API_BASE_URL } from "../constants/http";
import { nodeServer } from "../mocks/node";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it("adapts the current paginated assessment list and legacy windows", async () => {
  vi.stubEnv("VITE_API_MODE", "live");
  vi.resetModules();
  nodeServer.use(
    http.get(`${API_BASE_URL}/assessments/my`, () =>
      HttpResponse.json({
        data: [
          {
            id: "legacy-exam",
            type: "exam",
            courseId: "course-1",
            title: "Legacy exam",
            status: "draft",
            questions: [{ questionId: "q-1", points: 4 }],
            opensAt: "2026-12-01T08:00:00.000Z",
            closesAt: "2026-12-01T10:00:00.000Z",
            durationMinutes: 60,
            maxAttempts: 1,
          },
        ],
        pagination: { page: 2, limit: 10, total: 11 },
      }),
    ),
  );
  const { listAssessments } = await import("./assessments");
  await expect(listAssessments({ page: 2, pageSize: 10, type: "exam" })).resolves.toMatchObject({
    page: 2,
    pageSize: 10,
    total: 11,
    items: [{ id: "legacy-exam", windowStart: "2026-12-01T08:00:00.000Z" }],
  });
});

it("does not fabricate legacy question weights for live assessment creation", async () => {
  vi.stubEnv("VITE_API_MODE", "live");
  vi.resetModules();
  const { createAssessment } = await import("./assessments");
  await expect(
    createAssessment({
      type: "exam",
      courseId: "course-1",
      title: "Legacy incompatibility",
      questionIds: ["q-1"],
      shuffle: true,
      showResults: "immediate",
      targetMode: "all_course_students",
      studentIds: [],
      windowStart: "2026-12-01T08:00:00.000Z",
      windowEnd: "2026-12-01T10:00:00.000Z",
      durationMinutes: 60,
      maxAttempts: 1,
    }),
  ).rejects.toMatchObject({ code: "CAPABILITY_UNAVAILABLE", status: 501 });
});

it("unwraps a legacy assessment detail and disables unsupported live archive", async () => {
  vi.stubEnv("VITE_API_MODE", "live");
  vi.resetModules();
  nodeServer.use(
    http.get(`${API_BASE_URL}/assessments/legacy-assessment`, () =>
      HttpResponse.json({
        success: true,
        data: {
          id: "legacy-assessment",
          type: "quiz",
          courseId: "course-1",
          lessonId: "lesson-1",
          title: "Legacy quiz",
          status: "published",
          questions: [{ sourceQuestionId: "question-1", points: 3 }],
          maxAttempts: 1,
          attemptCount: 1,
        },
      }),
    ),
  );
  const { archiveAssessment, getAssessment } = await import("./assessments");
  await expect(getAssessment("legacy-assessment")).resolves.toMatchObject({
    lessonId: "lesson-1",
    questionIds: ["question-1"],
    status: "published",
  });
  await expect(archiveAssessment("legacy-assessment")).rejects.toMatchObject({
    code: "CAPABILITY_UNAVAILABLE",
    status: 501,
  });
});
