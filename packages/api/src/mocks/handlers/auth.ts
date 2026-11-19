import { http, HttpResponse } from "msw";
import { API_BASE_URL } from "../../constants/http";
import { AUTH_OTP_ATTEMPT_LIMIT, AUTH_OTP_LIFETIME_SECONDS } from "../../constants/auth";
import {
  MOCK_AUTH_USERS,
  MOCK_ACADEMIC_CATALOG,
  MOCK_ACCESS_TOKEN,
  MOCK_EXPIRED_ACCESS_TOKEN,
  AUTH_OTP_SCENARIOS,
  AUTH_SCENARIO_EMAILS,
} from "../fixtures/auth";

let activeUserEmail: string | undefined;
let registrationEmail: string | undefined;
let registrationRole: "student" | "teacher" = "student";
let deviceRequestCreated = false;
let refreshShouldFail = false;

/** Resets per-browser mock session state between isolated test requests. */
export function resetAuthMockState(): void {
  activeUserEmail = undefined;
  registrationEmail = undefined;
  registrationRole = "student";
  deviceRequestCreated = false;
  refreshShouldFail = false;
}

function authError(code: string, status: number, details?: unknown, retryAfterSeconds?: number) {
  return HttpResponse.json(
    { error: { code, message: code, ...(details === undefined ? {} : { details }) } },
    {
      status,
      ...(retryAfterSeconds ? { headers: { "retry-after": String(retryAfterSeconds) } } : {}),
    },
  );
}

function userForEmail(email: string) {
  if (email === registrationEmail && registrationRole === "teacher") {
    return {
      id: "registered-teacher-id",
      name: "New Teacher",
      role: "teacher" as const,
      status: "active" as const,
      email,
      emailVerified: true,
      applicationStatus: "pending" as const,
    };
  }
  return (
    MOCK_AUTH_USERS[email] ?? {
      id: "registered-student-id",
      name: "New Student",
      role: "student" as const,
      status: "active" as const,
      email,
      emailVerified: true,
    }
  );
}

export const authHandlers = [
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email ?? "";
    if (email === AUTH_SCENARIO_EMAILS.networkFailure) return HttpResponse.error();
    if (email === AUTH_SCENARIO_EMAILS.rateLimited)
      return authError("RATE_LIMITED", 429, undefined, 30);
    if (email === AUTH_SCENARIO_EMAILS.deviceBlocked)
      return authError("DEVICE_NOT_REGISTERED", 403);
    if (email === AUTH_SCENARIO_EMAILS.suspended) return authError("ACCOUNT_SUSPENDED", 403);
    if (email === AUTH_SCENARIO_EMAILS.wrongPassword || body.password === "wrong-password") {
      return authError("INVALID_CREDENTIALS", 401);
    }
    activeUserEmail = email;
    return HttpResponse.json({
      accessToken:
        email === AUTH_SCENARIO_EMAILS.sessionExpired
          ? MOCK_EXPIRED_ACCESS_TOKEN
          : MOCK_ACCESS_TOKEN,
      expiresInSeconds: 1800,
      user: userForEmail(email),
    });
  }),
  http.post(`${API_BASE_URL}/auth/register/student`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; phone?: string; name?: string };
    if (body.email === AUTH_SCENARIO_EMAILS.emailTaken) return authError("EMAIL_TAKEN", 409);
    if (body.phone === AUTH_SCENARIO_EMAILS.phoneTaken) return authError("PHONE_TAKEN", 409);
    if (!body.name || !body.email || !body.phone) {
      return authError("VALIDATION_ERROR", 400, {
        name: "required",
        email: "required",
        phone: "required",
      });
    }
    registrationEmail = body.email;
    return HttpResponse.json({ emailVerificationRequired: true }, { status: 201 });
  }),
  http.post(`${API_BASE_URL}/auth/register/teacher`, async ({ request }) => {
    const body = await request.formData();
    if (body.get("email") === AUTH_SCENARIO_EMAILS.emailTaken) return authError("EMAIL_TAKEN", 409);
    if (body.get("phone") === AUTH_SCENARIO_EMAILS.phoneTaken) return authError("PHONE_TAKEN", 409);
    registrationEmail = String(body.get("email") ?? "");
    registrationRole = "teacher";
    return HttpResponse.json(
      { applicationStatus: "pending", emailVerificationRequired: true },
      { status: 201 },
    );
  }),
  http.post(`${API_BASE_URL}/auth/verify-email`, async ({ request }) => {
    const body = (await request.json()) as { code?: string };
    if (body.code === AUTH_OTP_SCENARIOS.invalid) return authError("OTP_INVALID", 400);
    if (body.code === AUTH_OTP_SCENARIOS.expired) return authError("OTP_EXPIRED", 400);
    if (body.code === AUTH_OTP_SCENARIOS.rateLimited)
      return authError("OTP_RATE_LIMITED", 429, { remainingAttempts: 0 }, 60);
    return HttpResponse.json({ success: true, remainingAttempts: AUTH_OTP_ATTEMPT_LIMIT });
  }),
  http.post(`${API_BASE_URL}/auth/resend-code`, () =>
    HttpResponse.json({ success: true, retryAfterSeconds: AUTH_OTP_LIFETIME_SECONDS }),
  ),
  http.post(`${API_BASE_URL}/auth/forgot-password`, () => HttpResponse.json({ success: true })),
  http.post(`${API_BASE_URL}/auth/reset-password`, async ({ request }) => {
    const body = (await request.json()) as { code?: string };
    if (body.code === AUTH_OTP_SCENARIOS.invalid) return authError("OTP_INVALID", 400);
    if (body.code === AUTH_OTP_SCENARIOS.expired) return authError("OTP_EXPIRED", 400);
    if (body.code === AUTH_OTP_SCENARIOS.rateLimited)
      return authError("OTP_RATE_LIMITED", 429, undefined, 60);
    return HttpResponse.json({ success: true });
  }),
  http.post(`${API_BASE_URL}/auth/refresh`, () => {
    if (refreshShouldFail) {
      refreshShouldFail = false;
      return authError("UNAUTHORIZED", 401);
    }
    return HttpResponse.json({ accessToken: MOCK_ACCESS_TOKEN });
  }),
  http.post(`${API_BASE_URL}/auth/logout`, () => {
    activeUserEmail = undefined;
    return new HttpResponse(null, { status: 204 });
  }),
  http.get(`${API_BASE_URL}/auth/me`, ({ request }) => {
    if (
      request.headers.get("token") === MOCK_EXPIRED_ACCESS_TOKEN ||
      request.headers.get("authorization") === `Bearer ${MOCK_EXPIRED_ACCESS_TOKEN}`
    ) {
      refreshShouldFail = true;
      return authError("UNAUTHORIZED", 401);
    }
    if (
      request.headers.get("token") !== MOCK_ACCESS_TOKEN &&
      request.headers.get("authorization") !== `Bearer ${MOCK_ACCESS_TOKEN}`
    ) {
      return authError("UNAUTHORIZED", 401);
    }
    const email = activeUserEmail ?? registrationEmail ?? AUTH_SCENARIO_EMAILS.student;
    return HttpResponse.json(userForEmail(email));
  }),
  http.get(`${API_BASE_URL}/academic/public/catalog`, () =>
    HttpResponse.json(MOCK_ACADEMIC_CATALOG),
  ),
  http.post(`${API_BASE_URL}/devices/change-requests`, async ({ request }) => {
    if (activeUserEmail === AUTH_SCENARIO_EMAILS.sessionExpired) {
      refreshShouldFail = true;
      return authError("UNAUTHORIZED", 401);
    }
    const body = (await request.json()) as { reason?: string };
    deviceRequestCreated = true;
    return HttpResponse.json(
      {
        id: "device-request-id",
        status: "pending",
        ...(body.reason ? { reason: body.reason } : {}),
      },
      { status: 201 },
    );
  }),
  http.get(`${API_BASE_URL}/devices/change-requests/me`, () =>
    deviceRequestCreated
      ? HttpResponse.json({ id: "device-request-id", status: "pending" })
      : authError("DEVICE_NOT_REGISTERED", 404),
  ),
];
