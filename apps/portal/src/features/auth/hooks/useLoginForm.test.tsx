import { act, type PropsWithChildren } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { renderHook } from "../../../shared/testing/render-hook";
import { useAuthSnapshot } from "../../../shared/auth/auth-store";
import { useLoginForm } from "./useLoginForm";

function RouterWrapper({ children }: PropsWithChildren) {
  return <MemoryRouter initialEntries={["/login?returnTo=/teacher"]}>{children}</MemoryRouter>;
}

function useLoginWithSession() {
  return { login: useLoginForm(), session: useAuthSnapshot() };
}

describe("useLoginForm", () => {
  it("authenticates and clears submitted credentials", async () => {
    const hook = renderHook(useLoginWithSession, { wrapper: RouterWrapper });
    act(() => {
      hook.result.login.form.setValue("email", "student@example.test");
      hook.result.login.form.setValue("password", "Aa1!pass");
    });
    await act(async () => hook.result.login.submit());
    expect(hook.result.session.user?.role).toBe("student");
    expect(hook.result.login.form.getValues()).toEqual({ email: "", password: "" });
  });

  it("maps bad credentials and clears the password", async () => {
    const hook = renderHook(() => useLoginForm(), { wrapper: RouterWrapper });
    act(() => {
      hook.result.form.setValue("email", "wrong-password@example.test");
      hook.result.form.setValue("password", "Aa1!pass");
    });
    await act(async () => hook.result.submit());
    expect(hook.result.errorKey).toBe("errors:auth.INVALID_CREDENTIALS");
    expect(hook.result.form.getValues("password")).toBe("");
  });
});
