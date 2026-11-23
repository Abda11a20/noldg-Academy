import { describe, expect, it } from "vitest";
import { adaptCurrentAuthError } from "./errors";
import { adaptLegacyUser } from "./legacy";
import { AuthUserSchema } from "../../contracts/auth";
import { AppError } from "../../errors/app-error";

describe("auth contract adapters", () => {
  it("keeps target contract responses valid in mock mode", () => {
    expect(
      AuthUserSchema.parse({
        id: "student-id",
        name: "Mona Ali",
        role: "student",
        status: "active",
        email: "mona@example.test",
        emailVerified: true,
      }).role,
    ).toBe("student");
  });

  it("maps legacy profile field names and teacher review state to the target user", () => {
    const user = adaptLegacyUser(
      {
        _id: "teacher-id",
        name: "Salma Hassan",
        email: "salma@example.test",
        roles: "teacher",
        isVerified: true,
        status: "active",
      },
      {
        success: true,
        data: { approvalStatus: "rejected" },
      },
    );
    expect(user).toMatchObject({
      role: "teacher",
      applicationStatus: "rejected",
      emailVerified: true,
    });
  });

  it("maps legacy credential, device, and rate-limit failures to target codes", () => {
    const invalidCredentials = new AppError({
      code: "HTTP_ERROR",
      status: 401,
      message_key: "errors:requestFailed",
      details: { legacyMessage: "Invalid credentials" },
    });
    const deviceMismatch = new AppError({
      code: "HTTP_ERROR",
      status: 401,
      message_key: "errors:requestFailed",
      details: { legacyMessage: "This token is not valid for this device" },
    });
    const rateLimited = new AppError({
      code: "HTTP_ERROR",
      status: 429,
      message_key: "errors:requestFailed",
    });
    const badRequest = new AppError({
      code: "HTTP_ERROR",
      status: 400,
      message_key: "errors:requestFailed",
    });
    expect(adaptCurrentAuthError(invalidCredentials, "login").code).toBe("INVALID_CREDENTIALS");
    expect(adaptCurrentAuthError(deviceMismatch, "login").code).toBe("DEVICE_NOT_REGISTERED");
    expect(adaptCurrentAuthError(rateLimited, "login").code).toBe("RATE_LIMITED");
    expect(adaptCurrentAuthError(badRequest, "login").code).toBe("VALIDATION_ERROR");
    expect(adaptCurrentAuthError(new Error("network"), "login").code).toBe("AUTH_REQUEST_FAILED");
    expect(
      adaptCurrentAuthError(
        new AppError({
          code: "HTTP_ERROR",
          status: 403,
          message_key: "errors:requestFailed",
          details: { legacyMessage: "Account suspended" },
        }),
        "profile",
      ).code,
    ).toBe("ACCOUNT_SUSPENDED");
    expect(
      adaptCurrentAuthError(
        new AppError({
          code: "HTTP_ERROR",
          status: 409,
          message_key: "errors:requestFailed",
          details: { legacyMessage: "Email already exists" },
        }),
        "register",
      ).code,
    ).toBe("EMAIL_TAKEN");
  });
});
