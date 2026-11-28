import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { capabilities } from "@noldg/api/config/capabilities";
import { API_BASE_URL } from "@noldg/api/constants/http";
import { MOCK_QUESTIONS } from "@noldg/api/mocks/fixtures/assessments";
import { http, HttpResponse, nodeServer } from "@noldg/api/mocks/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import i18n from "../../../shared/i18n";
import { loadRouteNamespace } from "../../../shared/i18n/load-route-namespace";
import { renderPage } from "../../../shared/testing/render-page";
import { LessonQuizSection } from "./LessonQuizSection";

const originalTargeting = capabilities.assessmentTargeting;
const originalThreshold = capabilities.quizThresholdSetting;

beforeEach(async () => {
  capabilities.assessmentTargeting = originalTargeting;
  capabilities.quizThresholdSetting = originalThreshold;
  await Promise.all([
    i18n.changeLanguage("en"),
    loadRouteNamespace("assessments"),
    loadRouteNamespace("questions"),
  ]);
});

afterEach(() => {
  capabilities.assessmentTargeting = originalTargeting;
  capabilities.quizThresholdSetting = originalThreshold;
  cleanup();
});

describe("lesson quiz section", () => {
  it("creates and publishes a quiz with a custom watch percentage", async () => {
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
          { ...(createdInput as object), id: "lesson-quiz-1", status: "draft", attemptCount: 0 },
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
    fireEvent.change(screen.getByLabelText("Unlock watch percentage"), {
      target: { value: "80" },
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
      requiredWatchPercentage: 80,
      maxAttempts: 1,
    });
  });

  it("creates a new MCQ inline via CreateQuestionDialog and saves a draft quiz", async () => {
    const bank = [MOCK_QUESTIONS[0]!];
    let createdQuiz: unknown;
    nodeServer.use(
      http.get(`${API_BASE_URL}/assessments/courses/course-1`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 20, total: 0 }),
      ),
      http.get(`${API_BASE_URL}/questions/my`, () =>
        HttpResponse.json({ items: bank, page: 1, pageSize: 100, total: bank.length }),
      ),
      http.post(`${API_BASE_URL}/questions`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        const added = { ...MOCK_QUESTIONS[0]!, ...body, id: "inline-q-1" };
        bank.unshift(added);
        return HttpResponse.json(added, { status: 201 });
      }),
      http.post(`${API_BASE_URL}/assessments`, async ({ request }) => {
        createdQuiz = await request.json();
        return HttpResponse.json(
          { ...(createdQuiz as object), id: "quiz-draft-1", status: "draft", attemptCount: 0 },
          { status: 201 },
        );
      }),
    );

    renderPage(<LessonQuizSection courseId="course-1" lessonId="lesson-1" />);
    fireEvent.change(await screen.findByLabelText("Title"), {
      target: { value: "Draft lesson quiz" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create new question" }));
    fireEvent.change(await screen.findByLabelText("Question text"), {
      target: { value: "Inline MCQ stem?" },
    });
    fireEvent.change(screen.getByLabelText("Option 1"), { target: { value: "True choice" } });
    fireEvent.change(screen.getByLabelText("Option 2"), { target: { value: "False choice" } });
    fireEvent.click(screen.getByRole("button", { name: "Save question" }));

    expect(await screen.findByText("Question added.")).toBeTruthy();
    await waitFor(() => expect(screen.getByLabelText("Inline MCQ stem?")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Save quiz draft" }));
    await waitFor(() =>
      expect(createdQuiz).toMatchObject({
        title: "Draft lesson quiz",
        questionIds: ["inline-q-1"],
      }),
    );
  });
});

describe("lesson quiz states", () => {
  it("shows existing draft quiz with publish and results actions", async () => {
    let published = false;
    nodeServer.use(
      http.get(`${API_BASE_URL}/assessments/courses/course-1`, () =>
        HttpResponse.json({
          items: [
            {
              id: "lesson-quiz-draft",
              type: "quiz",
              courseId: "course-1",
              lessonId: "lesson-1",
              title: "Draft quiz",
              status: "draft",
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
      http.patch(`${API_BASE_URL}/assessments/lesson-quiz-draft/publish`, () => {
        published = true;
        return HttpResponse.json({
          id: "lesson-quiz-draft",
          type: "quiz",
          courseId: "course-1",
          lessonId: "lesson-1",
          title: "Draft quiz",
          status: "published",
          questionIds: [MOCK_QUESTIONS[0]!.id],
          shuffle: true,
          showResults: "immediate",
          targetMode: "all_course_students",
          studentIds: [],
          maxAttempts: 1,
          attemptCount: 0,
        });
      }),
    );

    renderPage(<LessonQuizSection courseId="course-1" lessonId="lesson-1" />);
    expect(
      await screen.findByText("This lesson already has a Draft quiz: Draft quiz."),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Results" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Publish quiz" }));
    await waitFor(() => expect(published).toBe(true));
  });

  it("shows unavailable and error states cleanly when capabilities or server fail", async () => {
    capabilities.quizThresholdSetting = false;
    nodeServer.use(
      http.get(`${API_BASE_URL}/assessments/courses/course-1`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 20, total: 0 }),
      ),
      http.get(`${API_BASE_URL}/questions/my`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 100, total: 0 }),
      ),
    );
    renderPage(<LessonQuizSection courseId="course-1" lessonId="lesson-1" />);
    expect(
      await screen.findByText(
        "Lesson quizzes need assessment and platform threshold support from the current backend.",
      ),
    ).toBeTruthy();
    cleanup();

    capabilities.quizThresholdSetting = true;
    nodeServer.use(
      http.get(`${API_BASE_URL}/assessments/courses/course-1`, () =>
        HttpResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 503 }),
      ),
    );
    renderPage(<LessonQuizSection courseId="course-1" lessonId="lesson-1" />);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Assessments could not be loaded.",
    );
  });
});
