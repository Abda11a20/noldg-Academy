import { expect, it } from "vitest";
import { adaptLegacyQuestion, adaptQuestionList } from "./assessments";
import { MOCK_QUESTIONS } from "../mocks/fixtures/assessments";

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
