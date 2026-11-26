import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@noldg/api/errors";
import { tokenStore } from "@noldg/api/auth/token-store";
import { getAuthSnapshot, retryAuthSession } from "./auth-store";

const { getMeMock } = vi.hoisted(() => ({ getMeMock: vi.fn() }));

vi.mock("@noldg/api/endpoints/auth", () => ({ getMe: getMeMock }));

describe("auth session initialization", () => {
  beforeEach(() => {
    tokenStore.clear();
    tokenStore.setSession({ accessToken: "saved-session" });
    getMeMock.mockReset();
  });

  it("clears the session and becomes anonymous only for a 404", async () => {
    getMeMock.mockRejectedValue(
      new AppError({ code: "NOT_FOUND", status: 404, message_key: "errors:requestFailed" }),
    );

    await retryAuthSession();

    expect(getAuthSnapshot().status).toBe("anonymous");
    expect(tokenStore.getAccessToken()).toBeNull();
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
