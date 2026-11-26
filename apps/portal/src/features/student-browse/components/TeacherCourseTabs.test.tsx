import { cleanup, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { renderPage } from "../../../shared/testing/render-page";
import i18n from "../../../shared/i18n";
import { TeacherCourseTabs } from "./TeacherCourseTabs";

afterEach(cleanup);

describe("TeacherCourseTabs", () => {
  it("explains when course previews are unavailable", async () => {
    await act(async () => i18n.changeLanguage("en"));
    renderPage(<TeacherCourseTabs courses={[]} enabled={false} arabic={false} locale="en" />);
    expect(screen.getByText("Course previews are unavailable")).toBeTruthy();
  });

  it("explains when the teacher has no course for the selected track", async () => {
    await act(async () => i18n.changeLanguage("en"));
    renderPage(<TeacherCourseTabs courses={[]} enabled arabic={false} locale="en" />);
    expect(screen.getByText("No courses for this track")).toBeTruthy();
  });
});
