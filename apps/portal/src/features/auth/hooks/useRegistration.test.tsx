import { act, type PropsWithChildren } from "react";
import { cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { renderHook } from "../../../shared/testing/render-hook";
import { renderPage } from "../../../shared/testing/render-page";
import { useStudentRegistration, useTeacherRegistration } from "./useRegistration";
import { StudentRegistrationFields } from "../components/StudentRegistrationFields";
import { describe, expect, it } from "vitest";

function RouterWrapper({ children }: PropsWithChildren) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe("registration hooks", () => {
  it("hides legacy student fields that the live adapter cannot save", () => {
    const hook = renderHook(() => useStudentRegistration(), { wrapper: RouterWrapper });
    const registration = { ...hook.result, supportsStudentProfileFields: false, unavailable: true };
    renderPage(
      <StudentRegistrationFields
        onSystemChange={() => undefined}
        registration={registration}
        system=""
        tracks={[]}
      />,
    );
    expect(document.getElementById("student-parent-phone")).toBeNull();
    expect(document.getElementById("student-system")).toBeNull();
    expect(document.getElementById("student-track")).toBeNull();
    expect(document.getElementById("student-terms")).toBeNull();
    cleanup();
    hook.unmount();
  });

  it("loads the catalog and submits student fields while clearing the password", async () => {
    const hook = renderHook(() => useStudentRegistration(), { wrapper: RouterWrapper });
    await act(async () => hook.result.loadCatalog());
    expect(hook.result.tracksForSystem("general")).toHaveLength(2);
    act(() => {
      hook.result.form.setValue("name", "Mona Ali");
      hook.result.form.setValue("email", "student-register@example.test");
      hook.result.form.setValue("phone", "+٢٠١١١١١١١١١١");
      hook.result.form.setValue("parentPhone", "+201111111112");
      hook.result.form.setValue("password", "Aa1!pass");
      hook.result.form.setValue("passwordConfirmation", "Aa1!pass");
      hook.result.form.setValue("trackId", "track-secondary-1");
      hook.result.form.setValue("acceptTerms", true);
    });
    await act(async () => hook.result.submit());
    expect(hook.result.errorKey).toBeNull();
    expect(hook.result.form.getValues("password")).toBe("");
    expect(hook.result.pending).toBe(false);
  });

  it("preserves field validation errors while clearing student passwords", async () => {
    const hook = renderHook(() => useStudentRegistration(), { wrapper: RouterWrapper });
    act(() => {
      hook.result.form.setValue("name", "Mona Ali");
      hook.result.form.setValue("email", "validation-error@example.test");
      hook.result.form.setValue("phone", "+201111111111");
      hook.result.form.setValue("parentPhone", "+201111111112");
      hook.result.form.setValue("password", "Aa1!pass");
      hook.result.form.setValue("passwordConfirmation", "Aa1!pass");
      hook.result.form.setValue("trackId", "track-secondary-1");
      hook.result.form.setValue("acceptTerms", true);
    });
    await act(async () => hook.result.submit());
    expect(hook.result.form.getFieldState("email").error?.message).toBe("errors:fieldInvalid");
    expect(hook.result.form.getValues("password")).toBe("");
  });

  it("builds and removes normalized teacher offerings before submission", async () => {
    const hook = renderHook(() => useTeacherRegistration(), { wrapper: RouterWrapper });
    await act(async () => hook.result.loadCatalog());
    act(() => hook.result.selectSystem("general"));
    act(() => hook.result.toggleTrack("track-secondary-1"));
    act(() => hook.result.toggleSubject("subject-mathematics"));
    act(() => hook.result.addOfferings());
    expect(hook.result.offerings).toEqual([
      {
        trackId: "track-secondary-1",
        subjectId: "subject-mathematics",
        system: "general",
        trackName: "First Secondary",
        subjectName: "Mathematics",
      },
    ]);
    act(() => hook.result.removeOffering("track-secondary-1", "subject-mathematics"));
    expect(hook.result.offerings).toEqual([]);
    expect(hook.result.form.getValues("offerings")).toEqual([]);
  });
});
