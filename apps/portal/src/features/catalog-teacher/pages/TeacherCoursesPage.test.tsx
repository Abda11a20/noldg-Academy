import { cleanup, screen } from "@testing-library/react";
import { http, HttpResponse, nodeServer } from "@noldg/api/mocks/testing";
import { API_BASE_URL } from "@noldg/api/constants/http";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import i18n from "../../../shared/i18n";
import { renderPage } from "../../../shared/testing/render-page";
import { TeacherCoursesPage } from "./TeacherCoursesPage";

beforeEach(async () => i18n.changeLanguage("en"));
afterEach(cleanup);

describe("teacher course list", () => {
  it("renders course details and opens its course route", async () => {
    nodeServer.use(
      http.get(`${API_BASE_URL}/courses/my`, () =>
        HttpResponse.json({
          items: [
            {
              id: "course-1",
              subject: { id: "subject-1", name: "Mathematics" },
              track: {
                id: "track-1",
                name: "Grade 1",
                system: "general",
                stage: "secondary",
                grade: 1,
              },
              lessonCount: 3,
              packageCount: 1,
              status: "active",
            },
          ],
          page: 1,
          pageSize: 20,
          total: 1,
        }),
      ),
    );
    renderPage(<TeacherCoursesPage />);
    expect((await screen.findAllByText("Mathematics")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Grade 1 · 1").length).toBeGreaterThan(0);
    expect(
      screen
        .getAllByRole("link", { name: "Open course" })
        .some((link) => link.getAttribute("href") === "/teacher/courses/course-1"),
    ).toBe(true);
  });

  it("renders an empty list from the server", async () => {
    nodeServer.use(
      http.get(`${API_BASE_URL}/courses/my`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 20, total: 0 }),
      ),
    );
    renderPage(<TeacherCoursesPage />);
    expect(await screen.findByText("No courses yet")).toBeTruthy();
  });

  it("shows a localized permission state on 403", async () => {
    nodeServer.use(
      http.get(`${API_BASE_URL}/courses/my`, () =>
        HttpResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 }),
      ),
    );
    renderPage(<TeacherCoursesPage />);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "You do not have access to this page.",
    );
  });
});
