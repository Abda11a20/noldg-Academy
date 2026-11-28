import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { capabilities } from "@noldg/api/config/capabilities";
import { API_BASE_URL } from "@noldg/api/constants/http";
import {
  MOCK_ASSESSMENTS,
  MOCK_COURSE_STUDENTS,
  MOCK_QUESTIONS,
} from "@noldg/api/mocks/fixtures/assessments";
import { http, HttpResponse, nodeServer } from "@noldg/api/mocks/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import i18n from "../../../shared/i18n";
import { loadRouteNamespace } from "../../../shared/i18n/load-route-namespace";
import { renderBuilder } from "./assessment-builder-test-utils";

const originalTargeting = capabilities.assessmentTargeting;

beforeEach(async () => {
  capabilities.assessmentTargeting = originalTargeting;
  await Promise.all([i18n.changeLanguage("en"), loadRouteNamespace("assessments")]);
});

afterEach(() => {
  capabilities.assessmentTargeting = originalTargeting;
  cleanup();
});

function installQuestionsAndStudents(
  questions: unknown[] = [MOCK_QUESTIONS[0], MOCK_QUESTIONS[1]],
) {
  nodeServer.use(
    http.get(`${API_BASE_URL}/questions/my`, () =>
      HttpResponse.json({ items: questions, page: 1, pageSize: 100, total: questions.length }),
    ),
    http.get(`${API_BASE_URL}/assessments/courses/:courseId/students`, () =>
      HttpResponse.json({ items: MOCK_COURSE_STUDENTS }),
    ),
    http.get(`${API_BASE_URL}/assessments/courses/:courseId`, () =>
      HttpResponse.json({ items: [], page: 1, pageSize: 20, total: 0 }),
    ),
  );
}

describe("assessment builder lock, errors, filters, leave guard, and capability states", () => {
  it("locks started assessments to window-end extension only and sends only windowEnd", async () => {
    const lockedExam = MOCK_ASSESSMENTS.items[1]!;
    let patched: unknown;
    installQuestionsAndStudents([MOCK_QUESTIONS[3], MOCK_QUESTIONS[4], MOCK_QUESTIONS[5]]);
    nodeServer.use(
      http.get(`${API_BASE_URL}/assessments/${lockedExam.id}`, () => HttpResponse.json(lockedExam)),
      http.patch(`${API_BASE_URL}/assessments/${lockedExam.id}`, async ({ request }) => {
        patched = await request.json();
        return HttpResponse.json({ ...lockedExam, ...(patched as object) });
      }),
    );

    renderBuilder(`/teacher/courses/course-1/assessments/${lockedExam.id}/edit`);
    expect(await screen.findByText(/Students have already started this assessment/u)).toBeTruthy();
    expect((screen.getByLabelText("Title") as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText("Opens at") as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText("Closes at") as HTMLInputElement).disabled).toBe(false);
    expect(
      screen.getByText("Closing time can only be extended after student attempts have started."),
    ).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Closes at"), {
      target: { value: "2027-01-15T18:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(patched).toBeDefined());
    expect(Object.keys(patched as Record<string, unknown>)).toEqual(["windowEnd"]);
  });

  it.each([
    ["POOL_TOO_SMALL", 400, "The random question count cannot exceed the selected question pool."],
    ["NO_QUESTIONS", 400, "Select at least one question before saving this assessment."],
    ["ASSESSMENT_WINDOW_INVALID", 400, "The assessment opening and closing window is invalid."],
    ["TARGET_STUDENT_INVALID", 400, "One or more selected students do not belong to this course."],
    [
      "ASSESSMENT_LOCKED",
      409,
      "This assessment is locked because students have already started an attempt.",
    ],
  ])("surfaces localized server error for %s", async (code, status, expected) => {
    installQuestionsAndStudents();
    nodeServer.use(
      http.post(`${API_BASE_URL}/assessments`, () =>
        HttpResponse.json({ error: { code } }, { status: Number(status) }),
      ),
    );

    renderBuilder("/teacher/courses/course-1/assessments/new/exam");
    fireEvent.change(await screen.findByLabelText("Title"), { target: { value: "Error test" } });
    fireEvent.change(screen.getByLabelText("Opens at"), { target: { value: "2027-02-01T10:00" } });
    fireEvent.change(screen.getByLabelText("Closes at"), { target: { value: "2027-02-01T12:00" } });
    fireEvent.click(screen.getByLabelText(MOCK_QUESTIONS[0]!.text));
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    expect((await screen.findAllByText(expected)).length).toBeGreaterThan(0);
  });

  it("filters bank questions by subject/lesson and hides legacy essay entries", async () => {
    installQuestionsAndStudents([
      MOCK_QUESTIONS[0],
      MOCK_QUESTIONS[1],
      {
        id: "legacy-1",
        text: "Write an essay",
        legacyType: "essay",
        options: [],
        supported: false,
      },
    ]);

    renderBuilder("/teacher/courses/course-1/assessments/new/exam");
    expect(
      await screen.findByText(
        "Unsupported legacy questions in your bank are hidden from selection.",
      ),
    ).toBeTruthy();
    expect(screen.queryByLabelText("Write an essay")).toBeNull();

    fireEvent.change(screen.getByLabelText("Filter by subject ID"), {
      target: { value: MOCK_QUESTIONS[0]!.subjectId! },
    });
    expect(screen.getByLabelText(MOCK_QUESTIONS[0]!.text)).toBeTruthy();
    expect(screen.queryByLabelText(MOCK_QUESTIONS[1]!.text)).toBeNull();
  });

  it("blocks navigation with unsaved changes and lets teacher stay or leave", async () => {
    installQuestionsAndStudents();
    renderBuilder("/teacher/courses/course-1/assessments/new/exam");
    fireEvent.change(await screen.findByLabelText("Title"), { target: { value: "Unsaved draft" } });
    fireEvent.click(screen.getByRole("link", { name: "Course" }));
    expect(await screen.findByText("Leave with unsaved changes?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Stay" }));
    expect(screen.getByLabelText("Title")).toBeTruthy();

    fireEvent.click(screen.getByRole("link", { name: "Course" }));
    fireEvent.click(await screen.findByRole("button", { name: "Leave page" }));
    expect(await screen.findByTestId("course-home")).toBeTruthy();
  });

  it("handles edit 403/404 failures and live capability-off notice", async () => {
    nodeServer.use(
      http.get(`${API_BASE_URL}/assessments/missing-id`, () =>
        HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 }),
      ),
      http.get(`${API_BASE_URL}/assessments/forbidden-id`, () =>
        HttpResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 }),
      ),
    );

    renderBuilder("/teacher/courses/course-1/assessments/missing-id/edit");
    expect((await screen.findByRole("alert")).textContent).toContain(
      "This assessment or attempt could not be found.",
    );
    cleanup();

    renderBuilder("/teacher/courses/course-1/assessments/forbidden-id/edit");
    expect((await screen.findByRole("alert")).textContent).toContain(
      "You do not have access to this page.",
    );
    cleanup();

    capabilities.assessmentTargeting = false;
    renderBuilder("/teacher/courses/course-1/assessments/new/exam");
    expect(
      await screen.findByText(
        "Assessment creation and advanced targeting require backend support that is not available in the current version.",
      ),
    ).toBeTruthy();
  });
});
