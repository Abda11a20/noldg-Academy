import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { tokenStore } from "../../auth/token-store";
import { nodeServer } from "../../mocks/node";
import { API_BASE_URL } from "../../constants/http";
import {
  createDeviceChangeRequest,
  forgotPassword,
  getMe,
  getMyDeviceChangeRequest,
  getPublicCatalog,
  login,
  logout,
  refresh,
  registerStudent,
  registerTeacher,
  resendCode,
  resetPassword,
  verifyEmail,
} from "./index";

const validPassword = "Example!123";

afterEach(() => {
  tokenStore.clear();
  vi.restoreAllMocks();
});

describe("target auth endpoints in mock mode", () => {
  it("logs in, fetches the current user, refreshes, and clears the session on logout", async () => {
    const result = await login({ email: "student@example.test", password: validPassword });
    expect(result.user.role).toBe("student");
    expect(tokenStore.getAccessToken()).toBe(result.accessToken);
    await expect(getMe()).resolves.toMatchObject({ id: "student-id" });
    await expect(refresh()).resolves.toBe(result.accessToken);
    await logout();
    expect(tokenStore.getAccessToken()).toBeNull();
  });

  it("registers students and teachers with target request bodies", async () => {
    await expect(
      registerStudent({
        name: "Mona Ali",
        email: "mona-new@example.test",
        phone: "+201001234567",
        parentPhone: "+201009876543",
        password: validPassword,
        trackId: "track-secondary-1",
        acceptTerms: true,
      }),
    ).resolves.toMatchObject({ emailVerificationRequired: true });
    const image = new File(["image"], "teacher.png", { type: "image/png" });
    await expect(
      registerTeacher({
        name: "Salma Hassan",
        email: "salma-new@example.test",
        phone: "+201001234568",
        password: validPassword,
        bio: "Teaching experience",
        offerings: [{ trackId: "track-secondary-1", subjectId: "subject-arabic" }],
        image,
        acceptTerms: true,
      }),
    ).resolves.toMatchObject({ applicationStatus: "pending", emailVerificationRequired: true });
  });

  it("supports email OTP and recovery endpoints with safe error normalization", async () => {
    await expect(
      verifyEmail({ email: "student@example.test", code: "123456" }),
    ).resolves.toMatchObject({ success: true });
    await expect(resendCode({ email: "student@example.test" })).resolves.toMatchObject({
      retryAfterSeconds: 300,
    });
    await expect(forgotPassword({ email: "student@example.test" })).resolves.toMatchObject({
      success: true,
    });
    await expect(
      resetPassword({ email: "student@example.test", code: "123456", password: validPassword }),
    ).resolves.toMatchObject({ success: true });
    await expect(
      verifyEmail({ email: "student@example.test", code: "000000" }),
    ).rejects.toMatchObject({ code: "OTP_INVALID" });
  });

  it("loads the public catalog and manages a device change request", async () => {
    const catalog = await getPublicCatalog();
    expect(catalog.tracks[0]?.id).toBe("track-secondary-1");
    await expect(createDeviceChangeRequest({ reason: "New phone" })).resolves.toMatchObject({
      status: "pending",
    });
    await expect(getMyDeviceChangeRequest()).resolves.toMatchObject({ status: "pending" });
  });

  it("maps duplicate fields, validation, rate-limit and network scenarios", async () => {
    await expect(
      registerStudent({
        name: "Mona Ali",
        email: "email-taken@example.test",
        phone: "+201001234567",
        parentPhone: "+201009876543",
        password: validPassword,
        trackId: "track-secondary-1",
        acceptTerms: true,
      }),
    ).rejects.toMatchObject({ code: "EMAIL_TAKEN" });
    await expect(
      login({ email: "student@example.test", password: "wrong-password" }),
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    await expect(
      login({ email: "rate-limited@example.test", password: validPassword }),
    ).rejects.toMatchObject({ code: "RATE_LIMITED", details: { retryAfterSeconds: 30 } });
    await expect(
      login({ email: "network-failure@example.test", password: validPassword }),
    ).rejects.toMatchObject({ code: "NETWORK_ERROR" });
    await expect(
      login({ email: "suspended@example.test", password: validPassword }),
    ).rejects.toMatchObject({ code: "ACCOUNT_SUSPENDED" });
    await expect(
      login({ email: "device-blocked@example.test", password: validPassword }),
    ).rejects.toMatchObject({ code: "DEVICE_NOT_REGISTERED" });
    await expect(
      login({ email: "teacher-pending@example.test", password: validPassword }),
    ).resolves.toMatchObject({ user: { applicationStatus: "pending" } });
    await expect(
      login({ email: "teacher-rejected@example.test", password: validPassword }),
    ).resolves.toMatchObject({ user: { applicationStatus: "rejected" } });
    await expect(
      login({ email: "admin@example.test", password: validPassword }),
    ).resolves.toMatchObject({ user: { role: "admin" } });
    await expect(
      registerStudent({
        name: "Mona Ali",
        email: "mona@example.test",
        phone: "+201001234567",
        parentPhone: "+201009876543",
        password: validPassword,
        trackId: "track-secondary-1",
        acceptTerms: true,
      }),
    ).resolves.toMatchObject({ emailVerificationRequired: true });
    await expect(
      resetPassword({ email: "student@example.test", code: "111111", password: validPassword }),
    ).rejects.toMatchObject({ code: "OTP_EXPIRED" });
    await expect(
      resetPassword({ email: "student@example.test", code: "222222", password: validPassword }),
    ).rejects.toMatchObject({ code: "OTP_RATE_LIMITED" });
  });

  it("preserves multipart requests without adding a JSON content type", async () => {
    let contentType = "";
    nodeServer.use(
      http.post(`${API_BASE_URL}/multipart-check`, ({ request }) => {
        contentType = request.headers.get("content-type") ?? "";
        return HttpResponse.json({ success: true });
      }),
    );
    const { request } = await import("../../http/client");
    const { z } = await import("zod");
    const form = new FormData();
    form.set("key", "value");
    await request("/multipart-check", z.object({ success: z.boolean() }), {
      method: "POST",
      body: form,
    });
    expect(contentType).toContain("multipart/form-data");
  });
});
