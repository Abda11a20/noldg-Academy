import { cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderPage } from "../../../shared/testing/render-page";
import i18n from "../../../shared/i18n";
import { TeachersPage } from "./TeachersPage";

const browseCapabilities = vi.hoisted(() => ({
  studentTrackFilter: false,
  teacherBrowseFilters: false,
  teacherRatings: false,
}));

vi.mock("@noldg/api/mocks/mode", () => ({ apiMode: "live" }));
vi.mock("@noldg/api/config/capabilities", () => ({ capabilities: browseCapabilities }));
vi.mock("../hooks/useBrowseTeachers", () => ({
  useBrowseTeachers: () => ({
    data: { items: [], page: 1, pageSize: 12, total: 0 },
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

beforeEach(async () => i18n.changeLanguage("en"));
afterEach(cleanup);

function control(label: string): HTMLElement {
  return screen.getByLabelText(label);
}

describe("live mode with browse capabilities off", () => {
  beforeEach(() => {
    browseCapabilities.studentTrackFilter = false;
    browseCapabilities.teacherBrowseFilters = false;
  });

  it("keeps the capability notice and disables the track and filter controls", () => {
    renderPage(<TeachersPage />);
    expect(screen.getByText(/cannot filter by school track/)).toBeTruthy();
    expect(screen.getByText(/Some filters are unavailable/)).toBeTruthy();
    expect((control("School track") as HTMLButtonElement).disabled).toBe(true);
    expect((control("Search teachers") as HTMLInputElement).disabled).toBe(true);
    expect((control("Subject") as HTMLButtonElement).disabled).toBe(true);
    expect((control("Minimum rating") as HTMLButtonElement).disabled).toBe(true);
    expect((control("Has free lessons") as HTMLButtonElement).disabled).toBe(true);
    expect((control("Sort by") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Filters" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("enables the same controls when the capabilities are on", () => {
    browseCapabilities.studentTrackFilter = true;
    browseCapabilities.teacherBrowseFilters = true;
    renderPage(<TeachersPage />);
    expect(screen.queryByText(/cannot filter by school track/)).toBeNull();
    expect(screen.queryByText(/Some filters are unavailable/)).toBeNull();
    expect((control("School track") as HTMLButtonElement).disabled).toBe(false);
    expect((control("Search teachers") as HTMLInputElement).disabled).toBe(false);
    expect((control("Subject") as HTMLButtonElement).disabled).toBe(false);
    expect((control("Minimum rating") as HTMLButtonElement).disabled).toBe(false);
    expect((control("Has free lessons") as HTMLButtonElement).disabled).toBe(false);
    expect((control("Sort by") as HTMLButtonElement).disabled).toBe(false);
  });
});
