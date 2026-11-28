import i18n from "../../../shared/i18n";

const VALIDATION_MESSAGE_KEYS: Readonly<Record<string, string>> = {
  password_too_short: "auth:validation.passwordTooShort",
  password_too_long: "auth:validation.passwordTooLong",
  password_uppercase: "auth:validation.passwordUppercase",
  password_lowercase: "auth:validation.passwordLowercase",
  password_number: "auth:validation.passwordNumber",
  password_symbol: "auth:validation.passwordSymbol",
  passwordMismatch: "auth:validation.passwordMismatch",
  terms: "auth:validation.terms",
  track: "auth:validation.track",
  offerings: "auth:validation.offerings",
  bio: "auth:validation.bio",
  otp: "auth:validation.otp",
  file: "auth:validation.file",
  email: "auth:validation.email",
  phone: "auth:validation.phone",
  "errors:fieldInvalid": "errors:fieldInvalid",
};

/** Converts local and server field error identifiers into safe translated text. @param message Validation identifier from Zod or the normalized API error. */
export function translateFieldError(message: string | undefined): string {
  if (!message) return String(i18n.t("auth:validation.required" as never));
  const key = VALIDATION_MESSAGE_KEYS[message] ?? "auth:validation.required";
  return String(i18n.t(key as never));
}
