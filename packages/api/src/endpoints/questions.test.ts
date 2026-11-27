import { beforeEach, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import {
  archiveQuestion,
  createQuestion,
  getQuestion,
  listQuestions,
  restoreQuestion,
  updateQuestion,
} from "./questions";
import { resetAssessmentMockState } from "../mocks/testing";
import { API_BASE_URL } from "../constants/http";
import { nodeServer } from "../mocks/node";

beforeEach(() => resetAssessmentMockState());

it("lists the target mock bank with page metadata and filters", async () => {
  const firstPage = await listQuestions({ page: 1, pageSize: 10 });
  expect(firstPage).toMatchObject({ page: 1, pageSize: 10, total: 40 });
  expect(firstPage.items).toHaveLength(10);
  const filtered = await listQuestions({
    page: 1,
    pageSize: 20,
    search: "practice question 2",
    status: "active",
  });
  expect(
    filtered.items.every((question) => "status" in question && question.status === "active"),
  ).toBe(true);
  expect(filtered.items).toHaveLength(6);
  const narrowed = await listQuestions({
    page: 1,
    pageSize: 20,
    subjectId: "subject-1",
    lessonId: "lesson-1",
    difficulty: "hard",
    status: "active",
    search: "Practice question 12",
    courseId: "course-1",
  });
  expect(narrowed.items).toHaveLength(1);
});

it("creates, edits, archives, restores, and reads a question", async () => {
  const created = await createQuestion({
    type: "multiple_choice",
    text: "New question",
    options: [{ text: "A" }, { text: "B" }],
    correctIndex: 1,
    status: "active",
  });
  expect(created).toMatchObject({ id: "question-mock-41", used: false });
  const updated = await updateQuestion(created.id, { text: "Updated question" });
  expect(updated).toMatchObject({ text: "Updated question" });
  expect(await archiveQuestion(created.id)).toMatchObject({ status: "archived" });
  expect(await restoreQuestion(created.id)).toMatchObject({ status: "active" });
  expect(await getQuestion(created.id)).toMatchObject({ id: created.id });
});

it("normalizes list request failures and returns a not-found error for missing questions", async () => {
  nodeServer.use(
    http.get(`${API_BASE_URL}/questions/my`, () =>
      HttpResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 }),
    ),
  );
  await expect(listQuestions({ page: 1, pageSize: 10 })).rejects.toMatchObject({
    code: "FORBIDDEN",
    status: 403,
  });
  await expect(getQuestion("not-found")).rejects.toMatchObject({ status: 404 });
});
