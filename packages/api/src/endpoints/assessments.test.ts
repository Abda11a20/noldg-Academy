import { beforeEach, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { resetAssessmentMockState } from "../mocks/testing";
import { assessmentInputErrorCode } from "../mocks/handlers/assessments";
import { API_BASE_URL } from "../constants/http";
import { nodeServer } from "../mocks/node";
import {
  archiveAssessment,
  closeAssessment,
  createAssessment,
  getAssessment,
  getAssessmentAttempt,
  listAssessmentAttempts,
  listAssessments,
  listCourseAssessments,
  publishAssessment,
  updateAssessment,
} from "./assessments";

beforeEach(resetAssessmentMockState);

it("lists assessments by course, type, and status", async () => {
  const exams = await listAssessments({
    page: 1,
    pageSize: 20,
    courseId: "course-1",
    type: "exam",
  });
  expect(exams.items).toHaveLength(2);
  const homework = await listCourseAssessments("course-1");
  expect(homework.items.some((item) => item.type === "homework")).toBe(true);
  expect(await listAssessments({ page: 1, pageSize: 20, status: "archived" })).toMatchObject({
    total: 1,
    items: [{ type: "quiz" }],
  });
});

it("creates, updates, publishes, closes, archives, and loads an assessment", async () => {
  const created = await createAssessment({
    type: "exam",
    courseId: "course-1",
    title: "Unit test",
    questionIds: ["question-mock-1", "question-mock-2"],
    shuffle: true,
    showResults: "after_close",
    targetMode: "all_course_students",
    studentIds: [],
    windowStart: "2026-12-01T08:00:00.000Z",
    windowEnd: "2026-12-01T10:00:00.000Z",
    durationMinutes: 60,
    maxAttempts: 1,
  });
  expect(created).toMatchObject({ id: "assessment-mock-5", status: "draft", attemptCount: 0 });
  expect(await getAssessment(created.id)).toEqual(created);
  expect(await updateAssessment(created.id, { title: "Updated unit test" })).toMatchObject({
    title: "Updated unit test",
  });
  expect(await publishAssessment(created.id)).toMatchObject({ status: "published" });
  expect(await closeAssessment(created.id)).toMatchObject({ status: "closed" });
  expect(await archiveAssessment(created.id)).toMatchObject({ status: "archived" });
});

it("returns server-computed result summaries and frozen attempt detail", async () => {
  const results = await listAssessmentAttempts("assessment-exam-published", {
    page: 1,
    pageSize: 20,
    suspicious: true,
  });
  expect(results).toMatchObject({
    total: 1,
    items: [{ suspicious: true, score: 4 }],
    summary: { averageScore: 6, manualCount: 1, autoCount: 1, suspiciousCount: 1 },
  });
  const detail = await getAssessmentAttempt("assessment-exam-published", "attempt-2");
  expect(detail.questions[0]).toMatchObject({ question: { id: "question-mock-4" } });
});

it("normalizes forbidden and missing assessment results", async () => {
  await expect(getAssessment("missing-assessment")).rejects.toMatchObject({ status: 404 });
  await expect(
    getAssessmentAttempt("assessment-exam-published", "missing-attempt"),
  ).rejects.toMatchObject({
    status: 404,
  });
});

it("normalizes server and authorization failures for assessment lists", async () => {
  nodeServer.use(
    http.get(`${API_BASE_URL}/assessments/my`, () =>
      HttpResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 503 }),
    ),
  );
  await expect(listAssessments({ page: 1, pageSize: 20 })).rejects.toMatchObject({
    status: 503,
  });
  nodeServer.use(
    http.get(`${API_BASE_URL}/assessments/my`, () =>
      HttpResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 }),
    ),
  );
  await expect(listAssessments({ page: 1, pageSize: 20 })).rejects.toMatchObject({
    code: "FORBIDDEN",
    status: 403,
  });
});

it("maps invalid draft payloads to stable assessment error codes", async () => {
  const validDraft = {
    type: "exam",
    courseId: "course-1",
    title: "Assessment",
    questionIds: ["question-mock-1"],
    shuffle: true,
    showResults: "immediate",
    targetMode: "all_course_students",
    studentIds: [],
    windowStart: "2026-12-01T08:00:00.000Z",
    windowEnd: "2026-12-01T10:00:00.000Z",
    durationMinutes: 60,
    maxAttempts: 1,
  };
  const scenarios: Array<{ input: unknown; code: string }> = [
    { input: null, code: "QUESTION_INVALID" },
    { input: { ...validDraft, questionIds: [] }, code: "NO_QUESTIONS" },
    { input: { ...validDraft, randomCount: 2 }, code: "POOL_TOO_SMALL" },
    {
      input: {
        ...validDraft,
        windowStart: "2026-12-01T10:00:00.000Z",
        windowEnd: "2026-12-01T08:00:00.000Z",
      },
      code: "ASSESSMENT_WINDOW_INVALID",
    },
  ];

  for (const scenario of scenarios) {
    expect(assessmentInputErrorCode(scenario.input)).toBe(scenario.code);
  }
});

it("rejects archiving an assessment that already has attempts", async () => {
  await expect(archiveAssessment("assessment-exam-published")).rejects.toMatchObject({
    status: 409,
    code: "ASSESSMENT_LOCKED",
  });
});
