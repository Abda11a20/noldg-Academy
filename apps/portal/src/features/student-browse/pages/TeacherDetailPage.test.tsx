import { cleanup, screen } from "@testing-library/react";
import { delay, http, HttpResponse, nodeServer } from "@noldg/api/mocks/testing";
import { API_BASE_URL } from "@noldg/api/constants/http";
import { getBrowseTeacher } from "@noldg/api/endpoints/catalog";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Route, Routes } from "react-router";
import { renderPage } from "../../../shared/testing/render-page";
import i18n from "../../../shared/i18n";
import { TeacherDetailPage } from "./TeacherDetailPage";

beforeEach(async () => i18n.changeLanguage("en"));
afterEach(cleanup);

it("shows a neutral loading state while the teacher profile is pending", () => {
  nodeServer.use(
    http.get(`${API_BASE_URL}/teachers/:teacherId`, async () => {
      await delay(1000);
      return HttpResponse.json(await getBrowseTeacher("browse-teacher-1"));
    }),
  );
  renderDetailPage("/student/teachers/browse-teacher-1");
  expect(document.querySelector(".animate-pulse")).toBeTruthy();
});

it("shows each server availability value and the supplied product price and remaining count", async () => {
  const teacher = structuredClone(await getBrowseTeacher("browse-teacher-1"));
  const course = teacher.courses[0]!;
  course.lessons = ["upcoming", "available", "ended"].map((availability, index) => ({
    ...course.lessons[0]!,
    id: `lesson-${index}`,
    availability: availability as "upcoming" | "available" | "ended",
  }));
  nodeServer.use(http.get(`${API_BASE_URL}/teachers/:teacherId`, () => HttpResponse.json(teacher)));
  renderDetailPage("/student/teachers/browse-teacher-1?page=2&q=al");
  expect(await screen.findByText("Upcoming")).toBeTruthy();
  expect(screen.getByText("Available")).toBeTruthy();
  expect(screen.getByText("Ended")).toBeTruthy();
  expect(screen.getAllByText(/Current student price:/)).toHaveLength(2);
  expect(screen.getByText(/remaining/)).toBeTruthy();
  expect(screen.getByRole("link", { name: "Teachers for your track" })).toBeTruthy();
});

describe.each([
  { name: "not found", status: 404, expected: "Teacher not found" },
  { name: "forbidden", status: 403, expected: "You do not have permission to view this list" },
] as const)("teacher detail $name", ({ status, expected }) => {
  it("shows a safe error state", async () => {
    nodeServer.use(
      http.get(`${API_BASE_URL}/teachers/:teacherId`, () =>
        HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status }),
      ),
    );
    renderDetailPage("/student/teachers/missing");
    expect(await screen.findByText(expected)).toBeTruthy();
  });
});

it("shows a no-course state when the selected teacher has no course in the student track", async () => {
  const teacher = structuredClone(await getBrowseTeacher("browse-teacher-1"));
  teacher.courses[0]!.track.id = "track-azhar-secondary-1";
  nodeServer.use(http.get(`${API_BASE_URL}/teachers/:teacherId`, () => HttpResponse.json(teacher)));
  renderDetailPage("/student/teachers/browse-teacher-1?trackId=track-secondary-1");
  expect(await screen.findByText("No courses for this track")).toBeTruthy();
});

function renderDetailPage(path: string) {
  return renderPage(
    <Routes>
      <Route path="/student/teachers/:teacherId" element={<TeacherDetailPage />} />
    </Routes>,
    undefined,
    [path],
  );
}
