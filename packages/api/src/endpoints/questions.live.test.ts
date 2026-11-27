import { afterEach, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { API_BASE_URL } from "../constants/http";
import { nodeServer } from "../mocks/node";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it("adapts the live list envelope and preserves unsupported legacy entries", async () => {
  vi.stubEnv("VITE_API_MODE", "live");
  vi.resetModules();
  nodeServer.use(
    http.get(`${API_BASE_URL}/questions/my`, () =>
      HttpResponse.json({
        data: [
          {
            id: "single-live",
            text: "Single answer",
            type: "single_choice",
            options: ["A", "B"],
            correctAnswer: 1,
          },
          { id: "essay-live", text: "Essay", type: "essay", options: [], correctAnswer: null },
        ],
        pagination: { page: 2, limit: 2, total: 3, pages: 2 },
      }),
    ),
  );
  const { listQuestions } = await import("./questions");
  const result = await listQuestions({ page: 2, pageSize: 2, search: "ignored-live" });
  expect(result).toMatchObject({ page: 2, pageSize: 2, total: 3 });
  expect(result.items[0]).toMatchObject({ type: "multiple_choice", correctIndex: 1 });
  expect(result.items[1]).toMatchObject({ legacyType: "essay", supported: false });
});

it("sends only legacy-supported fields for live question creation", async () => {
  vi.stubEnv("VITE_API_MODE", "live");
  vi.resetModules();
  let body: unknown;
  nodeServer.use(
    http.post(`${API_BASE_URL}/questions`, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(
        {
          data: {
            id: "created-live",
            text: "Question",
            type: "single_choice",
            options: ["A", "B"],
            correctAnswer: 1,
          },
        },
        { status: 201 },
      );
    }),
  );
  const { createQuestion } = await import("./questions");
  await createQuestion({
    type: "multiple_choice",
    text: "Question",
    options: [{ text: "A" }, { text: "B" }],
    correctIndex: 1,
    imageUrl: "https://images.example.test/question.png",
    explanation: "Dropped for legacy API",
    subjectId: "subject-1",
    status: "active",
  });
  expect(body).toEqual({
    text: "Question",
    type: "single_choice",
    options: ["A", "B"],
    correctAnswer: 1,
  });
});

it("does not emulate archive with the legacy hard-delete route", async () => {
  vi.stubEnv("VITE_API_MODE", "live");
  vi.resetModules();
  const { archiveQuestion } = await import("./questions");
  await expect(archiveQuestion("question-live")).rejects.toMatchObject({
    code: "CAPABILITY_UNAVAILABLE",
    status: 501,
  });
});
