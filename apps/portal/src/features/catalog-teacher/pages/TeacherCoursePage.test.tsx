import { cleanup, screen } from "@testing-library/react";
import { http, HttpResponse, nodeServer } from "@noldg/api/mocks/testing";
import { API_BASE_URL } from "@noldg/api/constants/http";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import i18n from "../../../shared/i18n";
import { renderPage } from "../../../shared/testing/render-page";
import { TeacherCoursePage } from "./TeacherCoursePage";
import { MOCK_ASSESSMENTS } from "@noldg/api/mocks/fixtures/assessments";

const course = {
  id: "course-1",
  subject: { id: "subject-1", name: "Mathematics" },
  track: { id: "track-1", name: "Grade 1", system: "general", stage: "secondary", grade: 1 },
  lessonCount: 1,
  packageCount: 1,
  status: "active",
};
const lesson = {
  id: "lesson-1",
  courseId: "course-1",
  title: "Algebra basics",
  description: "",
  kind: "recorded",
  status: "published",
  availableFrom: "2026-01-01T00:00:00.000Z",
  availableUntil: "2030-01-01T00:00:00.000Z",
  access: "paid",
  price: 100,
  videoState: "ready",
  attachments: [],
};
const product = {
  id: "package-1",
  courseId: "course-1",
  type: "package",
  name: "Algebra package",
  price: 240,
  announcedLessonCount: 3,
  lessonIds: ["lesson-1"],
  status: "active",
};
const pricing = {
  fullPrice: 240,
  currentPrice: 160,
  announcedLessonCount: 3,
  remainingLessonCount: 2,
  commissionPercentage: 20,
  platformAmount: 32,
  teacherAmount: 128,
  isPurchasable: true,
};

beforeEach(async () => i18n.changeLanguage("en"));
afterEach(cleanup);

function setupCatalog() {
  nodeServer.use(
    http.get(`${API_BASE_URL}/courses/my`, () =>
      HttpResponse.json({ items: [course], page: 1, pageSize: 100, total: 1 }),
    ),
    http.get(`${API_BASE_URL}/lessons/courses/:courseId`, () =>
      HttpResponse.json({ items: [lesson], page: 1, pageSize: 20, total: 1 }),
    ),
    http.get(`${API_BASE_URL}/products/my`, () => HttpResponse.json([{ product, pricing }])),
    http.get(`${API_BASE_URL}/products/:productId/pricing`, () =>
      HttpResponse.json({ product, pricing }),
    ),
  );
  renderPage(
    <Routes>
      <Route element={<TeacherCoursePage />} path="/teacher/courses/:courseId" />
    </Routes>,
    undefined,
    ["/teacher/courses/course-1"],
  );
}

describe("teacher course detail", () => {
  it("shows the course lesson list and the server pricing preview in bundles", async () => {
    const user = userEvent.setup();
    setupCatalog();
    expect((await screen.findAllByText("Algebra basics")).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("tab", { name: "Bundles" }));
    expect((await screen.findAllByText("Algebra package")).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/EGP.*160/).length).toBeGreaterThan(0);
  });

  it("shows course exam and homework tabs with server assessment data", async () => {
    const user = userEvent.setup();
    nodeServer.use(
      http.get(`${API_BASE_URL}/courses/my`, () =>
        HttpResponse.json({ items: [course], page: 1, pageSize: 100, total: 1 }),
      ),
      http.get(`${API_BASE_URL}/assessments/courses/:courseId`, () =>
        HttpResponse.json(MOCK_ASSESSMENTS),
      ),
    );
    renderPage(
      <Routes>
        <Route element={<TeacherCoursePage />} path="/teacher/courses/:courseId" />
      </Routes>,
      undefined,
      ["/teacher/courses/course-1"],
    );
    await user.click(await screen.findByRole("tab", { name: "Exams and homework" }));
    expect((await screen.findAllByText(/First exam/)).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("tab", { name: "Homework" }));
    expect((await screen.findAllByText(/Grammar homework/)).length).toBeGreaterThan(0);
  });

  it("shows a permission state when the lesson list returns 403", async () => {
    nodeServer.use(
      http.get(`${API_BASE_URL}/courses/my`, () =>
        HttpResponse.json({ items: [course], page: 1, pageSize: 100, total: 1 }),
      ),
      http.get(`${API_BASE_URL}/lessons/courses/:courseId`, () =>
        HttpResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 }),
      ),
    );
    renderPage(
      <Routes>
        <Route element={<TeacherCoursePage />} path="/teacher/courses/:courseId" />
      </Routes>,
      undefined,
      ["/teacher/courses/course-1"],
    );
    expect((await screen.findByRole("alert")).textContent).toContain(
      "You do not have access to this page.",
    );
  });

  it("shows a permission state when bundle pricing is denied", async () => {
    const user = userEvent.setup();
    nodeServer.use(
      http.get(`${API_BASE_URL}/courses/my`, () =>
        HttpResponse.json({ items: [course], page: 1, pageSize: 100, total: 1 }),
      ),
      http.get(`${API_BASE_URL}/products/my`, () =>
        HttpResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 }),
      ),
    );
    renderPage(
      <Routes>
        <Route element={<TeacherCoursePage />} path="/teacher/courses/:courseId" />
      </Routes>,
      undefined,
      ["/teacher/courses/course-1"],
    );
    await user.click(await screen.findByRole("tab", { name: "Bundles" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "You do not have access to this page.",
    );
  });
});
