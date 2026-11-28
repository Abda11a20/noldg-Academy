import { expect, it } from "vitest";
import {
  adaptAssessment,
  adaptAssessmentAttempts,
  adaptAssessmentList,
  adaptAssessmentAttemptDetail,
  adaptLegacyQuestion,
  adaptQuestionList,
} from "./assessments";
import {
  MOCK_ASSESSMENTS,
  MOCK_ASSESSMENT_ATTEMPTS,
  MOCK_ASSESSMENT_ATTEMPT_DETAIL,
  MOCK_QUESTIONS,
} from "../mocks/fixtures/assessments";

it("adapts a legacy single-choice question as the target MCQ", () => {
  expect(
    adaptLegacyQuestion({
      id: "legacy-1",
      text: "سؤال",
      type: "single_choice",
      options: ["أ", "ب"],
      correctAnswer: 1,
    }),
  ).toMatchObject({ type: "multiple_choice", correctIndex: 1, status: "active" });
});

it.each([
  ["essay", "essay", "text answer"],
  ["true_false", "true_false", true],
  ["multiple_choice", "multiple_choice", [0, 1]],
] as const)("preserves legacy %s as a read-only unsupported entry", (type, legacyType, answer) => {
  expect(
    adaptLegacyQuestion({
      id: `legacy-${type}`,
      text: "Legacy question",
      type,
      options: ["A", "B"],
      correctAnswer: answer,
    }),
  ).toMatchObject({ legacyType, supported: false });
});

it("normalizes the legacy list pagination envelope", () => {
  expect(
    adaptQuestionList({
      data: [
        {
          id: "legacy-1",
          text: "Question",
          type: "single_choice",
          options: ["A", "B"],
          correctAnswer: 0,
        },
      ],
      pagination: { page: 2, limit: 10, total: 11 },
    }),
  ).toMatchObject({ page: 2, pageSize: 10, total: 11, items: [{ id: "legacy-1" }] });
});

it("accepts an already-normalized target list and rejects malformed list data", () => {
  expect(
    adaptQuestionList({ items: [MOCK_QUESTIONS[0]], page: 1, pageSize: 20, total: 40 }),
  ).toMatchObject({ total: 40 });
  expect(() => adaptQuestionList({ data: {} })).toThrowError(
    expect.objectContaining({ code: "RESPONSE_VALIDATION_FAILED", status: 502 }),
  );
  expect(() => adaptQuestionList(null)).toThrowError(
    expect.objectContaining({ code: "RESPONSE_VALIDATION_FAILED", status: 502 }),
  );
});

it("rejects malformed backend questions with a normalized response error", () => {
  expect(() => adaptLegacyQuestion({ id: "legacy", type: "essay" })).toThrowError(
    expect.objectContaining({ code: "RESPONSE_VALIDATION_FAILED", status: 502 }),
  );
});

it("keeps target assessment fields unchanged", () => {
  const target = MOCK_ASSESSMENTS.items[0];
  expect(adaptAssessment(target)).toEqual(target);
});

it("maps legacy assessment fields and weighted question selections to the target contract", () => {
  expect(
    adaptAssessment({
      id: "legacy-assessment",
      type: "exam",
      courseId: "course-1",
      title: "Legacy exam",
      status: "draft",
      questions: [
        { questionId: "question-mock-1", points: 2 },
        { questionId: "question-mock-2", points: 1 },
      ],
      opensAt: "2026-12-01T08:00:00.000Z",
      closesAt: "2026-12-01T10:00:00.000Z",
      durationMinutes: 60,
      maxAttempts: 1,
      attemptCount: 0,
    }),
  ).toMatchObject({
    id: "legacy-assessment",
    questionIds: ["question-mock-1", "question-mock-2"],
    windowStart: "2026-12-01T08:00:00.000Z",
    windowEnd: "2026-12-01T10:00:00.000Z",
    targetMode: "all_course_students",
  });
});

it("maps legacy selection identifiers and safely rejects unsupported or malformed assessments", () => {
  expect(
    adaptAssessment({
      id: "legacy-homework",
      type: "homework",
      courseId: "course-1",
      title: "Homework",
      status: "published",
      questions: ["question-1", null, {}, { sourceQuestionId: "question-2" }, { id: 3 }],
      opensAt: "2026-12-01T00:00:00.000Z",
      closesAt: "2026-12-02T00:00:00.000Z",
      maxAttempts: 1,
      attemptsCount: 2,
    }),
  ).toMatchObject({ questionIds: ["question-1", "question-2"], attemptCount: 2 });
  expect(() => adaptAssessment({ ...MOCK_ASSESSMENTS.items[0], type: "unknown" })).toThrowError(
    expect.objectContaining({ status: 502 }),
  );
  expect(() =>
    adaptAssessment({ ...MOCK_ASSESSMENTS.items[0], windowEnd: "invalid" }),
  ).toThrowError(expect.objectContaining({ status: 502 }));
  expect(() => adaptAssessment(null)).toThrowError(expect.objectContaining({ status: 502 }));
});

it("normalizes legacy assessment list pagination and preserves server result summaries", () => {
  expect(
    adaptAssessmentList({
      data: [
        {
          id: "legacy-homework",
          type: "homework",
          courseId: "course-1",
          title: "Homework",
          status: "published",
          questions: [{ questionId: "question-mock-1", points: 1 }],
          opensAt: "2026-12-01T00:00:00.000Z",
          closesAt: "2026-12-02T00:00:00.000Z",
          maxAttempts: 1,
        },
      ],
      pagination: { page: 2, limit: 10, total: 11 },
    }),
  ).toMatchObject({ page: 2, pageSize: 10, total: 11 });
  expect(
    adaptAssessmentAttempts({
      data: MOCK_ASSESSMENT_ATTEMPTS,
      pagination: { page: 1, limit: 20, total: 2 },
      summary: {
        averageScore: 6,
        manualCount: 1,
        autoCount: 1,
        suspiciousCount: 1,
      },
    }),
  ).toMatchObject({
    items: [{ suspicious: false }, { suspicious: true }],
    total: 2,
    summary: { averageScore: 6, manualCount: 1, autoCount: 1, suspiciousCount: 1 },
  });
  expect(adaptAssessmentList(MOCK_ASSESSMENTS)).toEqual(MOCK_ASSESSMENTS);
  expect(adaptAssessmentList({ data: [], pagination: {} })).toMatchObject({
    page: 1,
    pageSize: 1,
    total: 0,
  });
  expect(() => adaptAssessmentList({ data: {} })).toThrowError(
    expect.objectContaining({ status: 502 }),
  );
  expect(() => adaptAssessmentAttempts(null)).toThrowError(
    expect.objectContaining({ status: 502 }),
  );
  expect(() =>
    adaptAssessmentAttempts({ data: [], summary: { averageScore: "invalid" } }),
  ).toThrowError(expect.objectContaining({ status: 502 }));
  expect(adaptAssessmentAttemptDetail(MOCK_ASSESSMENT_ATTEMPT_DETAIL)).toEqual(
    MOCK_ASSESSMENT_ATTEMPT_DETAIL,
  );
  expect(() => adaptAssessmentAttemptDetail({ id: "bad" })).toThrowError(
    expect.objectContaining({ status: 502 }),
  );
});
