import { beforeAll, beforeEach, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { nodeServer } from "../../mocks/node";
import { resetAuthMockState } from "../../mocks/handlers/auth";
import { API_BASE_URL } from "../../constants/http";
import { tokenStore } from "../../auth/token-store";
import type * as AuthApi from "./index";

let authApi: typeof AuthApi;
const validPassword = "Example!123";

beforeAll(async () => {
  vi.stubEnv("VITE_API_MODE", "live");
  vi.stubEnv("VITE_AUTH_HEADER_STRATEGY", "legacy");
  vi.stubEnv("VITE_AUTH_CAP_PUBLIC_CATALOG", "true");
  authApi = await import("./index");
});

beforeEach(() => {
  tokenStore.clear();
  resetAuthMockState();
});

it("maps current login, profile, teacher application, and logout response shapes", async () => {
  nodeServer.use(
    http.post(`${API_BASE_URL}/auth/login`, () =>
      HttpResponse.json({ success: true, token: "legacy-access" }),
    ),
    http.get(`${API_BASE_URL}/auth/`, () =>
      HttpResponse.json({
        success: true,
        data: {
          _id: "teacher-id",
          name: "Salma Hassan",
          email: "teacher@example.test",
          roles: "teacher",
          status: "active",
          isVerified: true,
        },
      }),
    ),
    http.get(`${API_BASE_URL}/teachers/me/application`, () =>
      HttpResponse.json({
        success: true,
        data: {
          approvalStatus: "pending",
          offerings: [],
        },
      }),
    ),
    http.post(`${API_BASE_URL}/auth/logout`, () =>
      HttpResponse.json({ success: true, message: "Signed out" }),
    ),
  );
  const result = await authApi.login({ email: "teacher@example.test", password: "legacy-pass" });
  expect(result).toMatchObject({
    accessToken: "legacy-access",
    expiresInSeconds: 18_000,
    user: { role: "teacher", applicationStatus: "pending" },
  });
  expect(tokenStore.getAccessToken()).toBe("legacy-access");
  await authApi.logout();
  expect(tokenStore.getAccessToken()).toBeNull();
});

it("accepts only supported student fields and adapts the legacy signup response", async () => {
  let body: Record<string, unknown> = {};
  nodeServer.use(
    http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
      body = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({ success: true, data: { _id: "new-student-id" } }, { status: 201 });
    }),
  );
  const result = await authApi.registerStudent({
    name: "Mona Ali",
    email: "mona@example.test",
    phone: "+201001234567",
    password: validPassword,
  });
  expect(result).toEqual({ emailVerificationRequired: false, userId: "new-student-id" });
  expect(body).toEqual({
    name: "Mona Ali",
    email: "mona@example.test",
    phone: "+201001234567",
    password: validPassword,
  });
});

it("maps the legacy teacher signup multipart route and response", async () => {
  let form: FormData | undefined;
  nodeServer.use(
    http.post(`${API_BASE_URL}/teachers/signup`, async ({ request }) => {
      form = await request.formData();
      return HttpResponse.json(
        {
          success: true,
          data: {
            user: { _id: "teacher-id" },
            application: { approvalStatus: "pending" },
          },
        },
        { status: 201 },
      );
    }),
  );
  const result = await authApi.registerTeacher({
    name: "Teacher One",
    email: "teacher@example.test",
    phone: "+201001234567",
    password: validPassword,
    bio: "Teaching",
    offerings: [{ trackId: "track-1", subjectId: "subject-1" }],
    image: new File(["image"], "teacher.png", { type: "image/png" }),
    acceptTerms: true,
  });
  expect(result).toEqual({
    userId: "teacher-id",
    applicationStatus: "pending",
    emailVerificationRequired: false,
  });
  expect(form?.get("offerings")).toBe(
    JSON.stringify([{ trackId: "track-1", subjectId: "subject-1" }]),
  );
  expect(form?.has("acceptTerms")).toBe(false);
});

it("supports current recovery endpoints and rejects missing target-only capabilities gracefully", async () => {
  nodeServer.use(
    http.post(`${API_BASE_URL}/auth/forgot-password`, () =>
      HttpResponse.json({ success: true, message: "Recovery requested" }),
    ),
    http.post(`${API_BASE_URL}/auth/reset-password`, () =>
      HttpResponse.json({ success: true, message: "Password updated" }),
    ),
  );
  await expect(authApi.forgotPassword({ email: "student@example.test" })).resolves.toMatchObject({
    success: true,
  });
  await expect(
    authApi.resetPassword({
      email: "student@example.test",
      code: "123456",
      password: validPassword,
    }),
  ).resolves.toMatchObject({ success: true });
  await expect(
    authApi.verifyEmail({ email: "student@example.test", code: "123456" }),
  ).rejects.toMatchObject({ code: "CAPABILITY_UNAVAILABLE" });
  await expect(authApi.resendCode({ email: "student@example.test" })).rejects.toMatchObject({
    code: "CAPABILITY_UNAVAILABLE",
  });
  await expect(authApi.refresh()).rejects.toMatchObject({ code: "CAPABILITY_UNAVAILABLE" });
  await expect(authApi.createDeviceChangeRequest({})).rejects.toMatchObject({
    code: "CAPABILITY_UNAVAILABLE",
  });
  await expect(authApi.getMyDeviceChangeRequest()).rejects.toMatchObject({
    code: "CAPABILITY_UNAVAILABLE",
  });
});

it("maps legacy profile, application, logout, and catalog transport failures safely", async () => {
  nodeServer.use(
    http.get(`${API_BASE_URL}/auth/`, () =>
      HttpResponse.json({ success: false, message: "Expired token" }, { status: 401 }),
    ),
    http.post(`${API_BASE_URL}/auth/logout`, () =>
      HttpResponse.json({ success: false, message: "Expired token" }, { status: 401 }),
    ),
    http.get(`${API_BASE_URL}/academic/public/catalog`, () =>
      HttpResponse.json({ success: false, message: "Catalog unavailable" }, { status: 503 }),
    ),
  );
  await expect(authApi.getMe()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  await expect(authApi.logout()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  await expect(authApi.getPublicCatalog()).rejects.toMatchObject({
    code: "AUTH_REQUEST_FAILED",
    status: 503,
  });
  expect(tokenStore.getAccessToken()).toBeNull();
});

it("allows a teacher profile when no legacy application exists", async () => {
  nodeServer.use(
    http.get(`${API_BASE_URL}/auth/`, () =>
      HttpResponse.json({
        success: true,
        data: {
          _id: "teacher-id",
          name: "Salma Hassan",
          email: "teacher@example.test",
          roles: "teacher",
          status: "active",
          isVerified: true,
        },
      }),
    ),
    http.get(`${API_BASE_URL}/teachers/me/application`, () =>
      HttpResponse.json({ success: false, message: "Not found" }, { status: 404 }),
    ),
  );
  const user = await authApi.getMe();
  expect(user).toMatchObject({
    id: "teacher-id",
    role: "teacher",
    emailVerified: true,
  });
  expect(user).not.toHaveProperty("applicationStatus");
});

it("preserves the session and status when the legacy profile request returns 404", async () => {
  tokenStore.setSession({ accessToken: "saved-access" });
  nodeServer.use(
    http.get(`${API_BASE_URL}/auth/`, () =>
      HttpResponse.json({ success: false, message: "Not found" }, { status: 404 }),
    ),
  );

  await expect(authApi.getMe()).rejects.toMatchObject({ status: 404 });
  expect(tokenStore.getAccessToken()).toBe("saved-access");
});

it("preserves the session when the legacy profile request returns a server error", async () => {
  tokenStore.setSession({ accessToken: "saved-access" });
  nodeServer.use(
    http.get(`${API_BASE_URL}/auth/`, () =>
      HttpResponse.json({ success: false, message: "Unavailable" }, { status: 500 }),
    ),
  );

  await expect(authApi.getMe()).rejects.toMatchObject({ status: 500 });
  expect(tokenStore.getAccessToken()).toBe("saved-access");
});

it("preserves the session when the legacy profile request has a network failure", async () => {
  tokenStore.setSession({ accessToken: "saved-access" });
  nodeServer.use(http.get(`${API_BASE_URL}/auth/`, () => HttpResponse.error()));

  await expect(authApi.getMe()).rejects.toMatchObject({ status: 0, code: "AUTH_REQUEST_FAILED" });
  expect(tokenStore.getAccessToken()).toBe("saved-access");
});

it("maps a recognizable legacy credential error into the target error code", async () => {
  nodeServer.use(
    http.post(`${API_BASE_URL}/auth/login`, () =>
      HttpResponse.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        { status: 401 },
      ),
    ),
  );
  await expect(
    authApi.login({ email: "student@example.test", password: "wrong" }),
  ).rejects.toMatchObject({
    code: "INVALID_CREDENTIALS",
    message_key: "errors:auth.INVALID_CREDENTIALS",
  });
});
