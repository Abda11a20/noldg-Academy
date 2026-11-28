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

function installBuilderBase(questions: unknown[] = [MOCK_QUESTIONS[0], MOCK_QUESTIONS[1]]) {
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

describe("assessment builder creation and editing", () => {
  it("creates and publishes a targeted exam with random pool, rules, and Cairo UTC windows", async () => {
    let submitted: unknown;
    let published = false;
    installBuilderBase();
    nodeServer.use(
      http.post(`${API_BASE_URL}/assessments`, async ({ request }) => {
        submitted = await request.json();
        return HttpResponse.json(
          { ...(submitted as object), id: "created-exam", status: "draft", attemptCount: 0 },
          { status: 201 },
        );
      }),
      http.patch(`${API_BASE_URL}/assessments/created-exam/publish`, () => {
        published = true;
        return HttpResponse.json({
          ...(submitted as object),
          id: "created-exam",
          status: "published",
          attemptCount: 0,
        });
      }),
    );

    renderBuilder("/teacher/courses/course-1/assessments/new/exam");
    fireEvent.change(await screen.findByLabelText("Title"), { target: { value: "Unit exam" } });
    fireEvent.change(screen.getByLabelText("Opens at"), { target: { value: "2027-02-01T12:00" } });
    fireEvent.change(screen.getByLabelText("Closes at"), { target: { value: "2027-02-01T14:00" } });
    fireEvent.change(screen.getByLabelText("Duration in minutes"), { target: { value: "45" } });
    fireEvent.change(screen.getByLabelText("Maximum attempts"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Random questions per attempt (optional)"), {
      target: { value: "2" },
    });
    expect(await screen.findByText(/exceeds the selected pool/u)).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Maximum tab leaves before flagging (optional)"), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByLabelText("Selected students"));
    fireEvent.click(await screen.findByLabelText(MOCK_COURSE_STUDENTS[1]!.name));
    fireEvent.click(screen.getByLabelText(MOCK_QUESTIONS[0]!.text));
    fireEvent.click(screen.getByLabelText(MOCK_QUESTIONS[1]!.text));
    fireEvent.click(screen.getByRole("button", { name: "Save and publish" }));

    await waitFor(() => expect(published).toBe(true));
    expect(submitted).toMatchObject({
      type: "exam",
      title: "Unit exam",
      durationMinutes: 45,
      maxAttempts: 2,
      randomCount: 2,
      maxTabLeaves: 3,
      targetMode: "selected_students",
      studentIds: [MOCK_COURSE_STUDENTS[1]!.id],
      questionIds: [MOCK_QUESTIONS[0]!.id, MOCK_QUESTIONS[1]!.id],
    });
  });

  it("creates homework with day-level dates, fixed single attempt, and no duration", async () => {
    let submitted: Record<string, unknown> | undefined;
    installBuilderBase();
    nodeServer.use(
      http.post(`${API_BASE_URL}/assessments`, async ({ request }) => {
        submitted = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          { ...submitted, id: "created-hw", status: "draft", attemptCount: 0 },
          { status: 201 },
        );
      }),
    );

    renderBuilder("/teacher/courses/course-1/assessments/new/homework");
    expect(screen.queryByLabelText("Duration in minutes")).toBeNull();
    fireEvent.change(await screen.findByLabelText("Title"), { target: { value: "Week 1 HW" } });
    fireEvent.change(screen.getByLabelText("Opening day"), { target: { value: "2027-02-05" } });
    fireEvent.change(screen.getByLabelText("Closing day"), { target: { value: "2027-02-10" } });
    fireEvent.click(screen.getByLabelText(MOCK_QUESTIONS[0]!.text));
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => expect(submitted).toBeDefined());
    expect(submitted).toMatchObject({
      type: "homework",
      title: "Week 1 HW",
      maxAttempts: 1,
    });
    expect(submitted?.durationMinutes).toBeUndefined();
  });

  it("edits an existing draft assessment and saves updated title and order", async () => {
    const draftExam = MOCK_ASSESSMENTS.items[0]!;
    let patched: unknown;
    installBuilderBase([MOCK_QUESTIONS[0], MOCK_QUESTIONS[1], MOCK_QUESTIONS[2]]);
    nodeServer.use(
      http.get(`${API_BASE_URL}/assessments/${draftExam.id}`, () => HttpResponse.json(draftExam)),
      http.patch(`${API_BASE_URL}/assessments/${draftExam.id}`, async ({ request }) => {
        patched = await request.json();
        return HttpResponse.json({ ...draftExam, ...(patched as object) });
      }),
    );

    renderBuilder(`/teacher/courses/course-1/assessments/${draftExam.id}/edit`);
    const titleInput = (await screen.findByLabelText("Title")) as HTMLInputElement;
    expect(titleInput.value).toBe(draftExam.title);
    fireEvent.change(titleInput, { target: { value: "Revised midterm" } });
    fireEvent.click(screen.getByRole("button", { name: `Move ${MOCK_QUESTIONS[1]!.text} up` }));
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(patched).toMatchObject({
        title: "Revised midterm",
        questionIds: [MOCK_QUESTIONS[1]!.id, MOCK_QUESTIONS[0]!.id, MOCK_QUESTIONS[2]!.id],
      }),
    );
  });
});
