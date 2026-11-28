import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { renderPage } from "../../../shared/testing/render-page";
import { TeacherCourseTabs } from "./TeacherCourseTabs";

afterEach(cleanup);

describe("TeacherCourseTabs", () => {
  it("explains when course previews are unavailable", async () => {
    renderPage(<TeacherCourseTabs courses={[]} enabled={false} arabic locale="ar" />);
    expect(await screen.findByText("معاينة الدورات غير متاحة")).toBeTruthy();
  });

  it("explains when the teacher has no course for the selected track", async () => {
    renderPage(<TeacherCourseTabs courses={[]} enabled arabic locale="ar" />);
    expect(await screen.findByText("لا توجد دورات لهذا الصف")).toBeTruthy();
  });
});
