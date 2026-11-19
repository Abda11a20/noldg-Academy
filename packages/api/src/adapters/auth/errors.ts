import { AppError } from "../../errors/app-error";
import type { AuthErrorCode } from "../../contracts/auth";

export type AuthOperation = "login" | "register" | "verify" | "recover" | "profile" | "device";

const currentErrorCodes: Readonly<Record<string, AuthErrorCode>> = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_TAKEN: "EMAIL_TAKEN",
  PHONE_TAKEN: "PHONE_TAKEN",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  OTP_INVALID: "OTP_INVALID",
  OTP_EXPIRED: "OTP_EXPIRED",
  OTP_RATE_LIMITED: "OTP_RATE_LIMITED",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  ACCOUNT_PENDING_REVIEW: "ACCOUNT_PENDING_REVIEW",
  ACCOUNT_REJECTED: "ACCOUNT_REJECTED",
  ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED",
  DEVICE_NOT_REGISTERED: "DEVICE_NOT_REGISTERED",
  RATE_LIMITED: "RATE_LIMITED",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
};

function legacyMessage(error: AppError): string {
  if (!error.details || typeof error.details !== "object" || !("legacyMessage" in error.details)) {
    return "";
  }
  return String(error.details.legacyMessage).toLowerCase();
}

function identifyLegacyMessage(message: string): AuthErrorCode | undefined {
  if (message.includes("device") && (message.includes("another") || message.includes("not valid")))
    return "DEVICE_NOT_REGISTERED";
  if (message.includes("suspend")) return "ACCOUNT_SUSPENDED";
  if (message.includes("already exist")) return "EMAIL_TAKEN";
  return undefined;
}

function identifyStatus(error: AppError, operation: AuthOperation): AuthErrorCode {
  if (error.status === 401) return operation === "login" ? "INVALID_CREDENTIALS" : "UNAUTHORIZED";
  if (error.status === 403) return "FORBIDDEN";
  if (error.status === 409) return "EMAIL_TAKEN";
  if (error.status === 429) return "RATE_LIMITED";
  if (error.status === 400) return "VALIDATION_ERROR";
  return "UNAUTHORIZED";
}

function identifyCurrentError(error: AppError, operation: AuthOperation): AuthErrorCode {
  const directCode = currentErrorCodes[error.code];
  if (directCode) return directCode;
  const messageCode = identifyLegacyMessage(legacyMessage(error));
  return messageCode ?? identifyStatus(error, operation);
}

/** Maps legacy backend statuses and recognizable messages to stable target auth codes. */
export function adaptCurrentAuthError(error: unknown, operation: AuthOperation): AppError {
  if (!(error instanceof AppError))
    return new AppError({
      code: "AUTH_REQUEST_FAILED",
      status: 0,
      message_key: "errors:requestFailed",
    });
  const code = identifyCurrentError(error, operation);
  return new AppError({
    code,
    status: error.status,
    message_key: `errors:auth.${code}`,
    ...(error.details === undefined ? {} : { details: error.details }),
  });
}

/** Creates a localized capability error without exposing unsupported backend routes. */
export function createCapabilityError(capability: string): AppError {
  return new AppError({
    code: "CAPABILITY_UNAVAILABLE",
    status: 501,
    message_key: "auth:capabilityUnavailable",
    details: { capability },
  });
}
