import { cleanup, screen } from "@testing-library/react";
import { http, HttpResponse, nodeServer } from "@noldg/api/mocks/testing";
import { API_BASE_URL } from "@noldg/api/constants/http";
import {
  MOCK_ASSESSMENT_ATTEMPTS,
  MOCK_ASSESSMENT_ATTEMPT_DETAIL,
  MOCK_ASSESSMENT_RESULTS_SUMMARY,
} from "@noldg/api/mocks/fixtures/assessments";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import i18n from "../../../shared/i18n";
import { loadRouteNamespace } from "../../../shared/i18n/load-route-namespace";
import { renderPage } from "../../../shared/testing/render-page";
import { Route, Routes } from "react-router";
import { AssessmentResultsPage } from "./AssessmentResultsPage";
import { AssessmentAttemptDetailPage } from "./AssessmentAttemptDetailPage";

const RESULTS_URL = `${API_BASE_URL}/assessments/assessment-exam-published/attempts`;
const DETAIL_URL = `${RESULTS_URL}/attempt-2`;

beforeEach(async () => {
  await Promise.all([i18n.changeLanguage("en"), loadRouteNamespace("assessments")]);
});
afterEach(cleanup);

function renderResults(
  path = "/teacher/courses/course-1/assessments/assessment-exam-published/results",
) {
  return renderPage(
    <Routes>
      <Route
        path="/teacher/courses/:courseId/assessments/:assessmentId/results"
        element={<AssessmentResultsPage />}
      />
      <Route
        path="/teacher/courses/:courseId/assessments/:assessmentId/results/:attemptId"
        element={<AssessmentAttemptDetailPage />}
      />
    </Routes>,
    undefined,
    [path],
  );
}

describe("assessment results pages", () => {
  it("renders server summary metrics and paginated attempts", async () => {
    nodeServer.use(
      http.get(RESULTS_URL, () =>
        HttpResponse.json({
          items: MOCK_ASSESSMENT_ATTEMPTS,
          page: 1,
          pageSize: 20,
          total: 2,
          summary: MOCK_ASSESSMENT_RESULTS_SUMMARY,
        }),
      ),
    );
    renderResults();
    expect(await screen.findByText("Average score")).toBeTruthy();
    expect(screen.getByText("6")).toBeTruthy();
    expect(screen.getAllByText("مريم حسن").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Omar Ali").length).toBeGreaterThan(0);
  });

  it("shows a permission state when results are forbidden", async () => {
    nodeServer.use(
      http.get(RESULTS_URL, () =>
        HttpResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 }),
      ),
    );
    renderResults();
    expect((await screen.findByRole("alert")).textContent).toContain(
      "You do not have access to this page.",
    );
  });

  it("shows the empty state when the server returns no attempts", async () => {
    nodeServer.use(
      http.get(RESULTS_URL, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 20, total: 0 }),
      ),
    );
    renderResults();
    expect(await screen.findByText("No attempts yet")).toBeTruthy();
    expect(screen.queryByRole("combobox", { name: "Rows per page" })).toBeNull();
  });

  it("renders the server-frozen question, student choice, and correct answer", async () => {
    nodeServer.use(http.get(DETAIL_URL, () => HttpResponse.json(MOCK_ASSESSMENT_ATTEMPT_DETAIL)));
    renderResults(
      "/teacher/courses/course-1/assessments/assessment-exam-published/results/attempt-2",
    );
    expect(
      await screen.findByText(MOCK_ASSESSMENT_ATTEMPT_DETAIL.questions[0]!.question.text),
    ).toBeTruthy();
    expect(screen.getByText("Student's answer")).toBeTruthy();
    expect(screen.getByText("Correct answer")).toBeTruthy();
  });

  it.each([
    ["missing", 404, "This assessment or attempt could not be found."],
    ["forbidden", 403, "You do not have access to this page."],
  ])("shows a safe %s state for a frozen attempt", async (_scenario, status, message) => {
    nodeServer.use(
      http.get(DETAIL_URL, () =>
        HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: Number(status) }),
      ),
    );
    renderResults(
      "/teacher/courses/course-1/assessments/assessment-exam-published/results/attempt-2",
    );
    expect((await screen.findByRole("alert")).textContent).toContain(String(message));
  });
});
