import i18n from "../../../shared/i18n";

const VALIDATION_MESSAGE_KEYS: Readonly<Record<string, string>> = {
  password_too_long: "validation.passwordTooLong",
  password_uppercase: "validation.passwordUppercase",
  password_lowercase: "validation.passwordLowercase",
  password_number: "validation.passwordNumber",
  password_symbol: "validation.passwordSymbol",
  passwordMismatch: "validation.passwordMismatch",
  offerings: "validation.offerings",
  file: "validation.file",
  email: "validation.email",
  phone: "validation.phone",
  errors: "errors:fieldInvalid",
};

/** Converts local and server field error identifiers into safe translated text. @param message Validation identifier from Zod or the normalized API error. */
export function translateFieldError(message: string | undefined): string {
  if (!message) return String(i18n.t("validation.required" as never));
  const key = VALIDATION_MESSAGE_KEYS[message] ?? "validation.required";
  return String(i18n.t(key as never));
}
