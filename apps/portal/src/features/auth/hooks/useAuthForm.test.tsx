import { act } from "react";
import { useForm } from "react-hook-form";
import { AppError } from "@noldg/api/errors";
import { describe, expect, it } from "vitest";
import { renderHook } from "../../../shared/testing/render-hook";
import { useAuthForm } from "./useAuthForm";

function useFormState() {
  const form = useForm<{ email: string }>();
  return { form, state: useAuthForm(form.setError) };
}

describe("useAuthForm", () => {
  it("tracks pending and error state", () => {
    const hook = renderHook(() => useAuthForm());
    expect(hook.result.pending).toBe(false);
    act(() => hook.result.setPending(true));
    expect(hook.result.pending).toBe(true);
    act(() => hook.result.setErrorKey("errors:requestFailed"));
    expect(hook.result.errorKey).toBe("errors:requestFailed");
  });

  it("maps normalized server field details to safe form errors", () => {
    const hook = renderHook(useFormState);
    const error = new AppError({
      code: "VALIDATION_ERROR",
      status: 400,
      message_key: "errors:requestFailed",
      details: { email: "invalid" },
    });
    act(() => hook.result.state.onFailure(error));
    expect(hook.result.state.errorKey).toBe("errors:auth.VALIDATION_ERROR");
    expect(hook.result.form.getFieldState("email").error?.message).toBe("errors:fieldInvalid");
  });
});
