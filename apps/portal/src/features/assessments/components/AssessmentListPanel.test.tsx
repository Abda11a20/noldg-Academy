import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { capabilities } from "@noldg/api/config/capabilities";
import { API_BASE_URL } from "@noldg/api/constants/http";
import { MOCK_ASSESSMENTS } from "@noldg/api/mocks/fixtures/assessments";
import { http, HttpResponse, nodeServer } from "@noldg/api/mocks/testing";
import { Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import i18n from "../../../shared/i18n";
import { loadRouteNamespace } from "../../../shared/i18n/load-route-namespace";
import { renderPage } from "../../../shared/testing/render-page";
import { AssessmentListPanel } from "./AssessmentListPanel";

const originalTargeting = capabilities.assessmentTargeting;

beforeEach(async () => {
  capabilities.assessmentTargeting = originalTargeting;
  await Promise.all([i18n.changeLanguage("en"), loadRouteNamespace("assessments")]);
});

afterEach(() => {
  capabilities.assessmentTargeting = originalTargeting;
  cleanup();
});

function renderList(type: "exam" | "homework" = "exam") {
  return renderPage(
    <Routes>
      <Route
        path="/teacher/courses/:courseId"
        element={<AssessmentListPanel courseId="course-1" type={type} />}
      />
      <Route
        path="/teacher/courses/:courseId/assessments/:assessmentId/edit"
        element={<div>{"edit-destination"}</div>}
      />
      <Route
        path="/teacher/courses/:courseId/assessments/:assessmentId/results"
        element={<div>{"results-destination"}</div>}
      />
      <Route
        path="/teacher/courses/:courseId/assessments/new/:type"
        element={<div>{"new-destination"}</div>}
      />
    </Routes>,
    undefined,
    ["/teacher/courses/course-1"],
  );
}

describe("assessment list panel", () => {
  it("renders status badges, Cairo windows, publish, close, and archive confirmations", async () => {
    let publishedId = "";
    let closedId = "";
    let archivedId = "";
    nodeServer.use(
      http.get(`${API_BASE_URL}/assessments/courses/course-1`, () =>
        HttpResponse.json(MOCK_ASSESSMENTS),
      ),
      http.patch(`${API_BASE_URL}/assessments/:id/publish`, ({ params }) => {
        publishedId = String(params.id);
        return HttpResponse.json({ ...MOCK_ASSESSMENTS.items[0]!, status: "published" });
      }),
      http.patch(`${API_BASE_URL}/assessments/:id/close`, ({ params }) => {
        closedId = String(params.id);
        return HttpResponse.json({ ...MOCK_ASSESSMENTS.items[1]!, status: "closed" });
      }),
      http.patch(`${API_BASE_URL}/assessments/:id/archive`, ({ params }) => {
        archivedId = String(params.id);
        return HttpResponse.json({ ...MOCK_ASSESSMENTS.items[0]!, status: "archived" });
      }),
    );

    renderList("exam");
    expect((await screen.findAllByText("Draft")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Published").length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("button", { name: "Publish" })[0]!);
    await waitFor(() => expect(publishedId).toBe("assessment-exam-draft"));
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Close" })[0]!.hasAttribute("disabled")).toBe(
        false,
      ),
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Close" })[0]!);
    expect(await screen.findByText("Close assessment?")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Close" }).at(-1)!);
    await waitFor(() => expect(closedId).toBe("assessment-exam-published"));
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Archive" })[0]!.hasAttribute("disabled")).toBe(
        false,
      ),
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Archive" })[0]!);
    expect(await screen.findByText("Archive assessment?")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Archive" }).at(-1)!);
    await waitFor(() => expect(archivedId).toBe("assessment-exam-draft"));
  });

  it("duplicates an assessment into a draft and navigates to edit", async () => {
    let duplicateTitle = "";
    nodeServer.use(
      http.get(`${API_BASE_URL}/assessments/courses/course-1`, () =>
        HttpResponse.json(MOCK_ASSESSMENTS),
      ),
      http.post(`${API_BASE_URL}/assessments`, async ({ request }) => {
        const body = (await request.json()) as { title: string };
        duplicateTitle = body.title;
        return HttpResponse.json(
          { ...MOCK_ASSESSMENTS.items[0]!, id: "assessment-copy-9", title: body.title },
          { status: 201 },
        );
      }),
    );

    renderList("exam");
    fireEvent.click((await screen.findAllByRole("button", { name: "Duplicate" }))[0]!);
    expect(await screen.findByText("edit-destination")).toBeTruthy();
    expect(duplicateTitle).toContain("(Copy)");
  });

  it("shows localized toast on ASSESSMENT_LOCKED archive rejection", async () => {
    nodeServer.use(
      http.get(`${API_BASE_URL}/assessments/courses/course-1`, () =>
        HttpResponse.json(MOCK_ASSESSMENTS),
      ),
      http.patch(`${API_BASE_URL}/assessments/:id/archive`, () =>
        HttpResponse.json({ error: { code: "ASSESSMENT_LOCKED" } }, { status: 409 }),
      ),
    );

    renderList("exam");
    fireEvent.click((await screen.findAllByRole("button", { name: "Archive" }))[0]!);
    fireEvent.click(screen.getAllByRole("button", { name: "Archive" }).at(-1)!);
    expect(
      await screen.findByText(
        "This assessment is locked because students have already started an attempt.",
      ),
    ).toBeTruthy();
  });

  it.each([
    ["empty", 200, { items: [], page: 1, pageSize: 20, total: 0 }, "No assessments yet"],
    ["forbidden", 403, { error: { code: "FORBIDDEN" } }, "You do not have access to this page."],
    ["error", 503, { error: { code: "SERVER_ERROR" } }, "Assessments could not be loaded."],
  ])("handles %s assessment list state", async (_label, status, body, expected) => {
    nodeServer.use(
      http.get(`${API_BASE_URL}/assessments/courses/course-1`, () =>
        HttpResponse.json(body, { status: Number(status) }),
      ),
    );
    renderList("homework");
    expect((await screen.findAllByText(String(expected))).length).toBeGreaterThan(0);
  });

  it("hides write controls and shows notice when live targeting capability is disabled", async () => {
    capabilities.assessmentTargeting = false;
    nodeServer.use(
      http.get(`${API_BASE_URL}/assessments/courses/course-1`, () =>
        HttpResponse.json(MOCK_ASSESSMENTS),
      ),
    );
    renderList("exam");
    expect(
      await screen.findByText(
        "Assessment creation and advanced targeting require backend support that is not available in the current version.",
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Create exam" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Duplicate" })).toBeNull();
  });
});
