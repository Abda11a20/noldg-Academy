import { cleanup, screen } from "@testing-library/react";
import { delay, http, HttpResponse, nodeServer } from "@noldg/api/mocks/testing";
import { API_BASE_URL } from "@noldg/api/constants/http";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { renderPage } from "../../../shared/testing/render-page";
import i18n from "../../../shared/i18n";
import { TeachersPage } from "./TeachersPage";

const listResult = {
  items: [],
  page: 1,
  pageSize: 12,
  total: 0,
  serverNow: "2026-11-26T05:00:00.000Z",
};
const scenarios = [
  { name: "empty", handler: () => HttpResponse.json(listResult), expected: "No teachers found" },
  {
    name: "error",
    handler: () => HttpResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 }),
    expected: "Teachers could not be loaded",
  },
  {
    name: "forbidden",
    handler: () => HttpResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 }),
    expected: "You do not have permission to view this list",
  },
] as const;

beforeEach(async () => i18n.changeLanguage("en"));
afterEach(cleanup);

it("shows list loading while the server is pending", async () => {
  nodeServer.use(
    http.get(`${API_BASE_URL}/teachers`, async () => {
      await delay(50);
      return HttpResponse.json(listResult);
    }),
  );
  renderPage(<TeachersPage />, undefined, ["/student/teachers?trackId=track-secondary-1"]);
  expect(screen.getByLabelText("Loading teachers")).toBeTruthy();
  expect(await screen.findByText("No teachers found")).toBeTruthy();
});

describe.each(scenarios)("teacher list $name response", ({ handler, expected }) => {
  it("renders the appropriate safe state", async () => {
    nodeServer.use(http.get(`${API_BASE_URL}/teachers`, handler));
    renderPage(<TeachersPage />);
    expect(await screen.findByText(expected)).toBeTruthy();
  });
});

it.each(["abc", "9", "4.75"])(
  "drops an invalid minRating=%s from the URL instead of failing the query",
  async (value) => {
    let seenMinRating: string | null = "unset";
    nodeServer.use(
      http.get(`${API_BASE_URL}/teachers`, ({ request }) => {
        seenMinRating = new URL(request.url).searchParams.get("minRating");
        return HttpResponse.json(listResult);
      }),
    );
    const filters = encodeURIComponent(JSON.stringify({ minRating: value }));
    renderPage(<TeachersPage />, undefined, [`/student/teachers?filters=${filters}`]);
    expect(await screen.findByText("No teachers found")).toBeTruthy();
    expect(seenMinRating).toBeNull();
    cleanup();
  },
);

it.each(["0", "999", "abc"])(
  "falls back to the default page size when the URL pageSize=%s is not allowed",
  async (value) => {
    let seenPageSize: string | null = null;
    nodeServer.use(
      http.get(`${API_BASE_URL}/teachers`, ({ request }) => {
        seenPageSize = new URL(request.url).searchParams.get("pageSize");
        return HttpResponse.json(listResult);
      }),
    );
    renderPage(<TeachersPage />, undefined, [`/student/teachers?pageSize=${value}`]);
    expect(await screen.findByText("No teachers found")).toBeTruthy();
    expect(seenPageSize).toBe(String(listResult.pageSize));
    cleanup();
  },
);

it("restores URL search and filters and hides absent rating and starting price", async () => {
  const teacher = {
    id: "teacher-no-summary",
    name: "Teacher One",
    nameAr: "المعلم الأول",
    photoUrl: null,
    bioExcerpt: "Bio",
    subjects: [{ id: "subject-math", name: "Mathematics" }],
    ratingAverage: null,
    ratingCount: 0,
    startingPrice: null,
    hasFreeLessons: true,
    createdAt: "2025-01-01T00:00:00.000Z",
  };
  nodeServer.use(
    http.get(`${API_BASE_URL}/teachers`, ({ request }) => {
      const url = new URL(request.url);
      expect(url.searchParams.get("trackId")).toBe("track-secondary-1");
      expect(url.searchParams.get("q")).toBe("mona");
      expect(url.searchParams.get("subjectId")).toBe("subject-math");
      expect(url.searchParams.get("minRating")).toBe("4");
      expect(url.searchParams.get("hasFreeLessons")).toBe("true");
      expect(url.searchParams.get("sort")).toBe("rating");
      return HttpResponse.json({ ...listResult, items: [teacher], total: 1 });
    }),
  );
  renderPage(<TeachersPage />, undefined, [
    "/student/teachers?trackId=track-secondary-1&page=1&pageSize=12&q=mona&sort=rating&filters=%7B%22subjectId%22%3A%22subject-math%22%2C%22minRating%22%3A%224%22%2C%22hasFreeLessons%22%3A%22true%22%7D",
  ]);
  expect(await screen.findByText("Teacher One")).toBeTruthy();
  expect(screen.getByText("New")).toBeTruthy();
  expect(screen.queryByText(/From/)).toBeNull();
});
