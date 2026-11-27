import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { delay, http, HttpResponse, nodeServer } from "@noldg/api/mocks/testing";
import { API_BASE_URL } from "@noldg/api/constants/http";
import { MOCK_STUDENT_LESSONS } from "@noldg/api/mocks/fixtures/learning";
import { afterEach, beforeEach, expect, it } from "vitest";
import { Route, Routes } from "react-router";
import { renderPage } from "../../../shared/testing/render-page";
import i18n from "../../../shared/i18n";
import { loadRouteNamespace } from "../../../shared/i18n/load-route-namespace";
import { LessonPage } from "./LessonPage";

function renderLesson(lessonId: string) {
  return renderPage(
    <Routes>
      <Route element={<LessonPage />} path="/student/lessons/:lessonId" />
    </Routes>,
    undefined,
    [`/student/lessons/${lessonId}`],
  );
}

beforeEach(async () => {
  await i18n.changeLanguage("en");
  await loadRouteNamespace("learning");
});
afterEach(cleanup);

it("shows the lesson loading state", () => {
  nodeServer.use(
    http.get(`${API_BASE_URL}/me/lessons/:lessonId`, async () => {
      await delay(1000);
      return HttpResponse.json(MOCK_STUDENT_LESSONS[0]);
    }),
  );
  renderLesson("lesson-introduction");
  expect(screen.getByRole("status").textContent).toBe("Loading lessons");
});

it("starts playback only after the available owned lesson is requested", async () => {
  let startRequestCount = 0;
  nodeServer.use(
    http.get(`${API_BASE_URL}/me/lessons/:lessonId`, () =>
      HttpResponse.json(MOCK_STUDENT_LESSONS[0]),
    ),
    http.post(`${API_BASE_URL}/lessons/:lessonId/playback`, () => {
      startRequestCount += 1;
      return HttpResponse.json({
        sessionId: "page-test-session",
        source: {
          method: "file",
          url: "https://media.example.test/lesson.mp4",
          expiresAt: "2026-11-28T10:00:00.000Z",
        },
        startPositionSeconds: 35,
        heartbeatIntervalSeconds: 10,
        watermark: { text: "Student" },
        serverNow: "2026-11-27T10:00:00.000Z",
      });
    }),
  );
  const { container } = renderLesson("lesson-introduction");
  fireEvent.click(await screen.findByRole("button", { name: "Start lesson" }));
  await waitFor(() => expect(startRequestCount).toBe(1));
  expect(await waitFor(() => container.querySelector("video"))).toBeTruthy();
  expect(screen.queryByText(/direct download/i)).toBeNull();
});

it.each([
  ["lesson-upcoming", "This lesson opens later"],
  ["lesson-ended", "This lesson has ended"],
] as const)("renders the server %s availability state", async (lessonId, expected) => {
  const lesson = MOCK_STUDENT_LESSONS.find((value) => value.id === lessonId);
  if (!lesson) throw new Error("Expected a fixture lesson for the test case.");
  nodeServer.use(http.get(`${API_BASE_URL}/me/lessons/:lessonId`, () => HttpResponse.json(lesson)));
  renderLesson(lessonId);
  expect(await screen.findByText(expected)).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Start lesson" })).toBeNull();
});

it("shows the access state and hides playback when the lesson is not owned", async () => {
  const availableLesson = MOCK_STUDENT_LESSONS[0];
  if (!availableLesson) throw new Error("Expected the available lesson fixture.");
  const lesson = { ...availableLesson, access: "not_owned" as const };
  nodeServer.use(http.get(`${API_BASE_URL}/me/lessons/:lessonId`, () => HttpResponse.json(lesson)));
  renderLesson(lesson.id);
  expect(await screen.findByText("This lesson is not included in your access")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Start lesson" })).toBeNull();
});

it("shows the quiz entry only when the server marks it available", async () => {
  const availableLesson = MOCK_STUDENT_LESSONS[0];
  if (!availableLesson) throw new Error("Expected the available lesson fixture.");
  const lesson = { ...availableLesson, quiz: { available: true, id: "quiz-one" } };
  nodeServer.use(http.get(`${API_BASE_URL}/me/lessons/:lessonId`, () => HttpResponse.json(lesson)));
  renderLesson(lesson.id);
  expect(await screen.findByRole("link", { name: "Open quiz" })).toBeTruthy();
});

it("renders a not-found state for an unknown lesson", async () => {
  nodeServer.use(
    http.get(`${API_BASE_URL}/me/lessons/:lessonId`, () =>
      HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 }),
    ),
  );
  renderLesson("unknown-lesson");
  expect(await screen.findByText("Lesson not found")).toBeTruthy();
});

it("shows a graceful capability state for live-only unavailable detail", async () => {
  nodeServer.use(
    http.get(`${API_BASE_URL}/me/lessons/:lessonId`, () =>
      HttpResponse.json({ error: { code: "CAPABILITY_UNAVAILABLE" } }, { status: 501 }),
    ),
  );
  renderLesson("lesson-introduction");
  expect(
    await screen.findByText("Lesson details are not available with the current service."),
  ).toBeTruthy();
});

it("reports attachment download failure without exposing backend text", async () => {
  const availableLesson = MOCK_STUDENT_LESSONS[0];
  if (!availableLesson) throw new Error("Expected the available lesson fixture.");
  nodeServer.use(
    http.get(`${API_BASE_URL}/me/lessons/:lessonId`, () => HttpResponse.json(availableLesson)),
    http.get(`${API_BASE_URL}/lessons/:lessonId/attachments/:attachmentId/download`, () =>
      HttpResponse.json(
        { error: { code: "SERVER_ERROR", message: "private server text" } },
        { status: 503 },
      ),
    ),
  );
  renderLesson("lesson-introduction");
  fireEvent.click(await screen.findByRole("button", { name: "Algebra notes.pdf" }));
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.queryByText("private server text")).toBeNull();
});
