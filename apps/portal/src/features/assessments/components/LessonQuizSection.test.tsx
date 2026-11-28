import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { API_BASE_URL } from "@noldg/api/constants/http";
import { http, HttpResponse, nodeServer } from "@noldg/api/mocks/testing";
import { MOCK_QUESTIONS } from "@noldg/api/mocks/fixtures/assessments";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import i18n from "../../../shared/i18n";
import { loadRouteNamespace } from "../../../shared/i18n/load-route-namespace";
import { renderPage } from "../../../shared/testing/render-page";
import { LessonQuizSection } from "./LessonQuizSection";

beforeEach(async () => {
  await Promise.all([i18n.changeLanguage("en"), loadRouteNamespace("assessments")]);
});
afterEach(cleanup);

describe("lesson quiz section", () => {
  it("creates and publishes a quiz with the platform threshold and selected questions", async () => {
    let createdInput: unknown;
    let published = false;
    nodeServer.use(
      http.get(`${API_BASE_URL}/assessments/courses/course-1`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 20, total: 0 }),
      ),
      http.get(`${API_BASE_URL}/questions/my`, () =>
        HttpResponse.json({ items: [MOCK_QUESTIONS[0]], page: 1, pageSize: 100, total: 1 }),
      ),
      http.post(`${API_BASE_URL}/assessments`, async ({ request }) => {
        createdInput = await request.json();
        return HttpResponse.json(
          {
            ...(createdInput as object),
            id: "lesson-quiz-1",
            status: "draft",
            attemptCount: 0,
          },
          { status: 201 },
        );
      }),
      http.patch(`${API_BASE_URL}/assessments/lesson-quiz-1/publish`, () => {
        published = true;
        return HttpResponse.json({
          ...(createdInput as object),
          id: "lesson-quiz-1",
          status: "published",
          attemptCount: 0,
        });
      }),
    );
    renderPage(<LessonQuizSection courseId="course-1" lessonId="lesson-1" />);
    fireEvent.change(await screen.findByLabelText("Title"), {
      target: { value: "Lesson checkpoint" },
    });
    fireEvent.click(screen.getByLabelText(MOCK_QUESTIONS[0]!.text));
    fireEvent.click(screen.getByRole("button", { name: "Create and publish quiz" }));
    await waitFor(() => expect(published).toBe(true));
    expect(createdInput).toMatchObject({
      type: "quiz",
      courseId: "course-1",
      lessonId: "lesson-1",
      title: "Lesson checkpoint",
      questionIds: [MOCK_QUESTIONS[0]!.id],
      requiredWatchPercentage: 75,
      maxAttempts: 1,
    });
  });

  it("shows an existing quiz without offering another create action", async () => {
    nodeServer.use(
      http.get(`${API_BASE_URL}/assessments/courses/course-1`, () =>
        HttpResponse.json({
          items: [
            {
              id: "lesson-quiz-1",
              type: "quiz",
              courseId: "course-1",
              lessonId: "lesson-1",
              title: "Existing quiz",
              status: "published",
              questionIds: [MOCK_QUESTIONS[0]!.id],
              shuffle: true,
              showResults: "immediate",
              targetMode: "all_course_students",
              studentIds: [],
              maxAttempts: 1,
              attemptCount: 0,
            },
          ],
          page: 1,
          pageSize: 20,
          total: 1,
        }),
      ),
      http.get(`${API_BASE_URL}/questions/my`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 100, total: 0 }),
      ),
    );
    renderPage(<LessonQuizSection courseId="course-1" lessonId="lesson-1" />);
    expect(
      await screen.findByText("This lesson already has a Published quiz: Existing quiz."),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Create and publish quiz" })).toBeNull();
  });
});
