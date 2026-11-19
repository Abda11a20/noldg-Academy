import { AppError } from "@noldg/api/errors";
import { AUTH_ERROR_CODES } from "@noldg/api/constants/auth";
import type { FieldPath, UseFormSetError, FieldValues } from "react-hook-form";

const AUTH_ERROR_CODE_SET: ReadonlySet<string> = new Set(AUTH_ERROR_CODES);
const FORM_FIELD_NAMES = [
  "name",
  "email",
  "phone",
  "parentPhone",
  "password",
  "trackId",
  "bio",
  "offerings",
  "code",
  "acceptTerms",
] as const;

/** Returns a translation key for normalized auth errors without exposing server messages. @param error Error received by the operation. */
export function authErrorKey(error: unknown): string {
  if (!(error instanceof AppError)) return "errors:requestFailed";
  if (AUTH_ERROR_CODE_SET.has(error.code)) return `errors:auth.${error.code}`;
  return error.message_key.startsWith("auth:") ? error.message_key : "errors:requestFailed";
}

/** Applies safe generic field messages for recognized server field names. @param error Normalized API error. @param setError React Hook Form field error setter. */
export function applyValidationFieldErrors<TValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TValues> | undefined,
): void {
  if (!setError || !(error instanceof AppError) || error.code !== "VALIDATION_ERROR") return;
  const details = error.details;
  if (!details || typeof details !== "object") return;
  FORM_FIELD_NAMES.forEach((name) => {
    if (name in details) {
      setError(name as FieldPath<TValues>, { type: "server", message: "errors:fieldInvalid" });
    }
  });
}
