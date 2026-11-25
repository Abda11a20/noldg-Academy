import { describe, expect, it } from "vitest";
import { AppError } from "../../errors/app-error";
import { adaptCurrentAuthError } from "./errors";
import { adaptLegacyUser } from "./legacy";

describe("auth contract adapters", () => {
  it("maps recognized codes, legacy messages, statuses, and unknown failures", () => {
    expect(
      adaptCurrentAuthError(
        new AppError({ code: "OTP_EXPIRED", status: 400, message_key: "raw" }),
        "verify",
      ).code,
    ).toBe("OTP_EXPIRED");
    expect(
      adaptCurrentAuthError(
        new AppError({
          code: "LEGACY",
          status: 400,
          message_key: "raw",
          details: { legacyMessage: "Device is not valid" },
        }),
        "login",
      ).code,
    ).toBe("DEVICE_NOT_REGISTERED");
    expect(
      adaptCurrentAuthError(
        new AppError({
          code: "LEGACY",
          status: 400,
          message_key: "raw",
          details: { legacyMessage: "Account suspended" },
        }),
        "login",
      ).code,
    ).toBe("ACCOUNT_SUSPENDED");
    expect(
      adaptCurrentAuthError(
        new AppError({
          code: "LEGACY",
          status: 400,
          message_key: "raw",
          details: { legacyMessage: "Email already exists" },
        }),
        "register",
      ).code,
    ).toBe("EMAIL_TAKEN");
    expect(
      adaptCurrentAuthError(
        new AppError({ code: "LEGACY", status: 409, message_key: "raw" }),
        "register",
      ).code,
    ).toBe("EMAIL_TAKEN");
    expect(
      adaptCurrentAuthError(
        new AppError({ code: "LEGACY", status: 403, message_key: "raw" }),
        "login",
      ).code,
    ).toBe("FORBIDDEN");
    expect(
      adaptCurrentAuthError(
        new AppError({ code: "LEGACY", status: 429, message_key: "raw" }),
        "login",
      ).code,
    ).toBe("RATE_LIMITED");
    expect(
      adaptCurrentAuthError(
        new AppError({ code: "LEGACY", status: 400, message_key: "raw" }),
        "login",
      ).code,
    ).toBe("VALIDATION_ERROR");
    expect(
      adaptCurrentAuthError(
        new AppError({ code: "LEGACY", status: 503, message_key: "raw" }),
        "login",
      ).code,
    ).toBe("AUTH_REQUEST_FAILED");
    expect(
      adaptCurrentAuthError(
        new AppError({ code: "LEGACY", status: 404, message_key: "raw" }),
        "login",
      ).code,
    ).toBe("AUTH_REQUEST_FAILED");
    expect(adaptCurrentAuthError(new Error("private transport detail"), "login")).toMatchObject({
      code: "AUTH_REQUEST_FAILED",
      message_key: "errors:requestFailed",
      status: 0,
    });
  });

  it("normalizes legacy identity aliases and optional teacher review data", () => {
    expect(
      adaptLegacyUser({
        _id: "student-id",
        name: "Mona",
        email: "mona@example.test",
        roles: "student",
        isVerified: false,
      }),
    ).toMatchObject({ id: "student-id", role: "student", emailVerified: false });
    expect(
      adaptLegacyUser(
        {
          id: "teacher-id",
          name: "Salma",
          email: "salma@example.test",
          role: "teacher",
          status: "suspended",
          emailVerified: true,
          trackId: "track-1",
        },
        { success: true, data: { approvalStatus: "rejected", rejectionReason: "Review details" } },
      ),
    ).toMatchObject({
      id: "teacher-id",
      status: "suspended",
      applicationStatus: "rejected",
      rejectionReason: "Review details",
    });
    expect(
      adaptLegacyUser(
        {
          id: "teacher-id",
          name: "Salma",
          email: "salma@example.test",
          role: "teacher",
        },
        { success: false, data: {} },
      ),
    ).not.toHaveProperty("applicationStatus");
  });
});
