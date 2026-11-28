import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { capabilities } from "@noldg/api/config/capabilities";
import { API_BASE_URL } from "@noldg/api/constants/http";
import {
  MOCK_ASSESSMENT_ATTEMPTS,
  MOCK_ASSESSMENT_ATTEMPT_DETAIL,
  MOCK_ASSESSMENT_RESULTS_SUMMARY,
} from "@noldg/api/mocks/fixtures/assessments";
import { http, HttpResponse, nodeServer } from "@noldg/api/mocks/testing";
import { Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import i18n from "../../../shared/i18n";
import { loadRouteNamespace } from "../../../shared/i18n/load-route-namespace";
import { renderPage } from "../../../shared/testing/render-page";
import { AssessmentAttemptDetailPage } from "./AssessmentAttemptDetailPage";
import { AssessmentResultsPage } from "./AssessmentResultsPage";

const RESULTS_URL = `${API_BASE_URL}/assessments/assessment-exam-published/attempts`;
const DETAIL_URL = `${RESULTS_URL}/attempt-2`;
const originalResultsCap = capabilities.assessmentResultsApi;

beforeEach(async () => {
  capabilities.assessmentResultsApi = originalResultsCap;
  await Promise.all([i18n.changeLanguage("en"), loadRouteNamespace("assessments")]);
});

afterEach(() => {
  capabilities.assessmentResultsApi = originalResultsCap;
  cleanup();
});

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
  it("renders server summary metrics and updates search and suspicious filters cleanly", async () => {
    let lastSuspicious: string | null = "unset";
    let lastSearch: string | null = null;
    nodeServer.use(
      http.get(RESULTS_URL, ({ request }) => {
        const url = new URL(request.url);
        lastSuspicious = url.searchParams.get("suspicious");
        lastSearch = url.searchParams.get("q");
        return HttpResponse.json({
          items: MOCK_ASSESSMENT_ATTEMPTS,
          page: 1,
          pageSize: 20,
          total: 2,
          summary: MOCK_ASSESSMENT_RESULTS_SUMMARY,
        });
      }),
    );

    renderResults();
    expect(await screen.findByText("Average score")).toBeTruthy();
    expect(screen.getByText("6")).toBeTruthy();
    expect(screen.getAllByText("مريم حسن").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByLabelText("Suspicious attempts only"));
    await waitFor(() => expect(lastSuspicious).toBe("true"));

    fireEvent.click(await screen.findByLabelText("Suspicious attempts only"));
    fireEvent.change(await screen.findByLabelText("Search students"), {
      target: { value: "Omar" },
    });
    await waitFor(() => expect(lastSearch).toBe("Omar"));
    expect(lastSuspicious).toBeNull();
  });

  it.each([
    ["forbidden", 403, "You do not have access to this page."],
    ["missing", 404, "This assessment or attempt could not be found."],
    ["server error", 503, "Assessments could not be loaded."],
  ])("shows a safe %s state on the results list", async (_label, status, message) => {
    nodeServer.use(
      http.get(RESULTS_URL, () =>
        HttpResponse.json({ error: { code: "ERROR" } }, { status: Number(status) }),
      ),
    );
    renderResults();
    expect((await screen.findByRole("alert")).textContent).toContain(String(message));
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
    ["server error", 503, "Assessments could not be loaded."],
  ])("shows a safe %s state for a frozen attempt", async (_scenario, status, message) => {
    nodeServer.use(
      http.get(DETAIL_URL, () =>
        HttpResponse.json({ error: { code: "ERROR" } }, { status: Number(status) }),
      ),
    );
    renderResults(
      "/teacher/courses/course-1/assessments/assessment-exam-published/results/attempt-2",
    );
    expect((await screen.findByRole("alert")).textContent).toContain(String(message));
  });

  it("shows unavailable state for both list and attempt detail when results capability is off", async () => {
    capabilities.assessmentResultsApi = false;
    renderResults();
    expect(
      await screen.findByText(
        "Assessment attempt results require backend support that is not available in the current version.",
      ),
    ).toBeTruthy();
    cleanup();

    renderResults(
      "/teacher/courses/course-1/assessments/assessment-exam-published/results/attempt-2",
    );
    expect(
      await screen.findByText(
        "Assessment attempt results require backend support that is not available in the current version.",
      ),
    ).toBeTruthy();
  });
});
