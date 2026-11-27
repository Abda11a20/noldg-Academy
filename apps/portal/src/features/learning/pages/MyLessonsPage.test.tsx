import { cleanup, screen } from "@testing-library/react";
import { delay, http, HttpResponse, nodeServer } from "@noldg/api/mocks/testing";
import { API_BASE_URL } from "@noldg/api/constants/http";
import { afterEach, beforeEach, expect, it } from "vitest";
import { renderPage } from "../../../shared/testing/render-page";
import i18n from "../../../shared/i18n";
import { loadRouteNamespace } from "../../../shared/i18n/load-route-namespace";
import { MOCK_LEARNING_SERVER_NOW, MOCK_STUDENT_LESSONS } from "@noldg/api/mocks/fixtures/learning";
import { MyLessonsPage } from "./MyLessonsPage";

const result = {
  items: MOCK_STUDENT_LESSONS,
  page: 1,
  pageSize: 20,
  total: 3,
  serverNow: MOCK_LEARNING_SERVER_NOW,
};

beforeEach(async () => {
  await i18n.changeLanguage("en");
  await loadRouteNamespace("learning");
});
afterEach(cleanup);

it("shows loading skeletons while the API is pending", () => {
  nodeServer.use(
    http.get(`${API_BASE_URL}/me/lessons`, async () => {
      await delay(1000);
      return HttpResponse.json(result);
    }),
  );
  renderPage(<MyLessonsPage />);
  expect(screen.getByRole("status", { name: "Loading lessons" })).toBeTruthy();
});

it("renders server availability, progress, and does not call ended lessons missed", async () => {
  nodeServer.use(http.get(`${API_BASE_URL}/me/lessons`, () => HttpResponse.json(result)));
  renderPage(<MyLessonsPage />);
  expect(await screen.findByText("Introduction to algebra")).toBeTruthy();
  expect(screen.getAllByText("Available now").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Ended").length).toBeGreaterThan(0);
  expect(screen.queryByText(/missed/i)).toBeNull();
  expect(
    screen.getByRole("progressbar", { name: "Progress for Introduction to algebra" }),
  ).toBeTruthy();
});

it("shows a localized empty state", async () => {
  nodeServer.use(
    http.get(`${API_BASE_URL}/me/lessons`, () =>
      HttpResponse.json({ ...result, items: [], total: 0 }),
    ),
  );
  renderPage(<MyLessonsPage />);
  expect(await screen.findByText("No lessons found")).toBeTruthy();
});

it.each([
  [500, "SERVER_ERROR", "Lessons could not be loaded. Try again."],
  [403, "FORBIDDEN", "You do not have permission to view these lessons."],
] as const)("shows a safe state for HTTP %s", async (status, code, expected) => {
  nodeServer.use(
    http.get(`${API_BASE_URL}/me/lessons`, () =>
      HttpResponse.json({ error: { code } }, { status }),
    ),
  );
  renderPage(<MyLessonsPage />);
  expect(await screen.findByText(expected)).toBeTruthy();
});

it("restores availability filters and page state from the URL", async () => {
  nodeServer.use(
    http.get(`${API_BASE_URL}/me/lessons`, ({ request }) => {
      const url = new URL(request.url);
      expect(url.searchParams.get("availability")).toBe("upcoming");
      expect(url.searchParams.get("page")).toBe("2");
      return HttpResponse.json({ ...result, items: [MOCK_STUDENT_LESSONS[1]], page: 2, total: 22 });
    }),
  );
  renderPage(<MyLessonsPage />, undefined, [
    "/student/lessons?page=2&pageSize=20&filters=%7B%22availability%22%3A%22upcoming%22%7D",
  ]);
  expect(await screen.findByText("Quadratic equations")).toBeTruthy();
});
