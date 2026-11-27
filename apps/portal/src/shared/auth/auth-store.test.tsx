import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@noldg/api/errors";
import { tokenStore } from "@noldg/api/auth/token-store";
import { getAuthSnapshot, retryAuthSession, setAuthenticatedUser } from "./auth-store";

const { getMeMock } = vi.hoisted(() => ({ getMeMock: vi.fn() }));

vi.mock("@noldg/api/endpoints/auth", () => ({ getMe: getMeMock }));

describe("auth session initialization", () => {
  beforeEach(() => {
    tokenStore.clear();
    tokenStore.setSession({ accessToken: "saved-session" });
    getMeMock.mockReset();
  });

  it("clears the session and becomes anonymous for 401, 404, and suspended 403", async () => {
    for (const error of [
      new AppError({ code: "UNAUTHORIZED", status: 401, message_key: "errors:auth.UNAUTHORIZED" }),
      new AppError({ code: "NOT_FOUND", status: 404, message_key: "errors:requestFailed" }),
      new AppError({
        code: "ACCOUNT_SUSPENDED",
        status: 403,
        message_key: "errors:auth.ACCOUNT_SUSPENDED",
      }),
    ]) {
      tokenStore.setSession({ accessToken: "saved-session" });
      getMeMock.mockRejectedValueOnce(error);

      await retryAuthSession();

      expect(getAuthSnapshot().status).toBe("anonymous");
      expect(tokenStore.getAccessToken()).toBeNull();
    }
  });

  it("does not overwrite a newer login with a stale initialization failure", async () => {
    let rejectPending!: (reason?: unknown) => void;
    getMeMock.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectPending = reject;
        }),
    );
    const initPromise = retryAuthSession();
    setAuthenticatedUser({
      id: "student-1",
      name: "Mona",
      email: "mona@example.test",
      role: "student",
      status: "active",
      emailVerified: true,
    });
    rejectPending(
      new AppError({ code: "NETWORK_ERROR", status: 0, message_key: "errors:networkError" }),
    );
    await initPromise;
    expect(getAuthSnapshot().status).toBe("authenticated");
    expect(getAuthSnapshot().user?.id).toBe("student-1");
  });

  it("preserves the session and exposes a transient state for a server error", async () => {
    getMeMock.mockRejectedValue(
      new AppError({ code: "HTTP_ERROR", status: 500, message_key: "errors:requestFailed" }),
    );

    await retryAuthSession();

    expect(getAuthSnapshot()).toMatchObject({ status: "error", error: { status: 500 } });
    expect(tokenStore.getAccessToken()).toBe("saved-session");
  });

  it("preserves the session and exposes a transient state for a network error", async () => {
    getMeMock.mockRejectedValue(
      new AppError({ code: "NETWORK_ERROR", status: 0, message_key: "errors:networkError" }),
    );

    await retryAuthSession();

    expect(getAuthSnapshot()).toMatchObject({ status: "error", error: { code: "NETWORK_ERROR" } });
    expect(tokenStore.getAccessToken()).toBe("saved-session");
  });
});
