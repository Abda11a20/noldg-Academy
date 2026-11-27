import { expect, it } from "vitest";
import { AssessmentSchema, QuestionInputSchema, QuestionSchema } from "./assessments";

const question = {
  id: "question-1",
  text: "ما ناتج ٢ + ٢؟",
  options: [{ text: "٣" }, { text: "٤" }],
  correctIndex: 1,
  status: "active",
  used: false,
};

it("requires two to five distinct options and a valid single correct index", () => {
  expect(QuestionSchema.safeParse(question).success).toBe(true);
  expect(QuestionSchema.safeParse({ ...question, options: [{ text: "أ" }] }).success).toBe(false);
  expect(
    QuestionSchema.safeParse({
      ...question,
      options: [
        { text: "أ" },
        { text: "ب" },
        { text: "ج" },
        { text: "د" },
        { text: "هـ" },
        { text: "و" },
      ],
    }).success,
  ).toBe(false);
  expect(
    QuestionSchema.safeParse({ ...question, options: [{ text: "نعم" }, { text: "نعم" }] }).success,
  ).toBe(false);
  expect(QuestionSchema.safeParse({ ...question, correctIndex: 2 }).success).toBe(false);
  expect(
    QuestionInputSchema.safeParse({
      text: "سؤال",
      options: [{ text: "أ" }, { text: "ب" }],
      correctIndex: 0,
      status: "active",
    }).success,
  ).toBe(true);
  expect(
    QuestionInputSchema.safeParse({
      text: "سؤال",
      options: [{ text: "أ" }, { text: "أ" }],
      correctIndex: 3,
      status: "active",
    }).success,
  ).toBe(false);
});

it("accepts the target exam and rejects invalid assessment type rules", () => {
  const exam = {
    id: "exam-1",
    type: "exam",
    courseId: "course-1",
    title: "امتحان",
    status: "draft",
    questionIds: ["question-1"],
    shuffle: true,
    showResults: "after_close",
    targetMode: "all_course_students",
    studentIds: [],
    windowStart: "2026-11-28T10:00:00Z",
    windowEnd: "2026-11-28T12:00:00Z",
    durationMinutes: 60,
    maxAttempts: 1,
    attemptCount: 0,
  };
  expect(AssessmentSchema.safeParse(exam).success).toBe(true);
  expect(AssessmentSchema.safeParse({ ...exam, durationMinutes: undefined }).success).toBe(false);
  expect(AssessmentSchema.safeParse({ ...exam, randomCount: 2 }).success).toBe(false);
  expect(
    AssessmentSchema.safeParse({ ...exam, targetMode: "selected_students", studentIds: [] })
      .success,
  ).toBe(false);
  expect(
    AssessmentSchema.safeParse({ ...exam, type: "homework", durationMinutes: 10 }).success,
  ).toBe(false);
  expect(
    AssessmentSchema.safeParse({ ...exam, type: "quiz", lessonId: undefined, maxAttempts: 2 })
      .success,
  ).toBe(false);
});

it("validates homework and quiz constraints", () => {
  const common = {
    id: "assessment-1",
    courseId: "course-1",
    title: "نشاط",
    status: "draft",
    questionIds: ["question-1"],
    shuffle: true,
    showResults: "immediate",
    targetMode: "selected_students",
    studentIds: ["student-1"],
    maxAttempts: 1,
    attemptCount: 0,
  };
  expect(
    AssessmentSchema.safeParse({
      ...common,
      type: "homework",
      windowStart: "2026-11-28T00:00:00Z",
      windowEnd: "2026-11-29T00:00:00Z",
    }).success,
  ).toBe(true);
  expect(
    AssessmentSchema.safeParse({
      ...common,
      type: "homework",
      windowStart: "2026-11-28T00:00:00Z",
      windowEnd: "2026-11-29T00:00:00Z",
      durationMinutes: 5,
    }).success,
  ).toBe(false);
  expect(
    AssessmentSchema.safeParse({
      ...common,
      type: "quiz",
      lessonId: "lesson-1",
      requiredWatchPercentage: 75,
    }).success,
  ).toBe(true);
  expect(
    AssessmentSchema.safeParse({
      ...common,
      type: "quiz",
      lessonId: "lesson-1",
      windowStart: "2026-11-28T00:00:00Z",
    }).success,
  ).toBe(false);
});
