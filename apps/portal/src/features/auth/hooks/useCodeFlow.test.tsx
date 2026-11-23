import { act, type PropsWithChildren } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { renderHook } from "../../../shared/testing/render-hook";
import { useForgotPasswordFlow, useResetPasswordFlow, useVerifyEmailFlow } from "./useCodeFlow";

function createRouter(initialState?: unknown) {
  return function RouterWrapper({ children }: PropsWithChildren) {
    return (
      <MemoryRouter
        initialEntries={[
          { pathname: "/verify-email", state: initialState ?? { email: "student@example.test" } },
        ]}
      >
        {children}
      </MemoryRouter>
    );
  };
}

describe("auth code flows", () => {
  it("verifies a valid code and clears it after submission", async () => {
    const hook = renderHook(() => useVerifyEmailFlow(), {
      wrapper: createRouter({ email: "student@example.test" }),
    });
    act(() => hook.result.setCode("123456"));
    await act(async () => hook.result.submit());
    expect(hook.result.code).toBe("");
    expect(hook.result.errorKey).toBeNull();
    expect(hook.result.remainingAttempts).toBeGreaterThan(0);
  });

  it("maps invalid OTP responses without exposing backend text", async () => {
    const hook = renderHook(() => useVerifyEmailFlow(), {
      wrapper: createRouter({ email: "student@example.test" }),
    });
    act(() => hook.result.setCode("000000"));
    await act(async () => hook.result.submit());
    expect(hook.result.errorKey).toBe("errors:auth.OTP_INVALID");
    expect(hook.result.code).toBe("");
  });

  it("submits password recovery with the email outside the URL", async () => {
    const hook = renderHook(() => useForgotPasswordFlow(), { wrapper: createRouter() });
    act(() => hook.result.form.setValue("email", "student@example.test"));
    await act(async () => hook.result.submit());
    expect(hook.result.pending).toBe(false);
    expect(hook.result.errorKey).toBeNull();
    expect(hook.result.form.getValues("email")).toBe("");
  });

  it("rejects a mismatched new password before calling the endpoint", async () => {
    const hook = renderHook(() => useResetPasswordFlow(), { wrapper: createRouter() });
    act(() => {
      hook.result.form.setValue("email", "student@example.test");
      hook.result.form.setValue("code", "123456");
      hook.result.form.setValue("password", "Aa1!pass");
      hook.result.form.setValue("passwordConfirmation", "Bb2!pass");
    });
    await act(async () => hook.result.submit());
    expect(hook.result.form.getFieldState("passwordConfirmation").error?.message).toBe(
      "passwordMismatch",
    );
  });
});
