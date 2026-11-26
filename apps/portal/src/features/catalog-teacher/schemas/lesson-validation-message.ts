import type { TFunction } from "i18next";

const LESSON_VALIDATION_KEYS = {
  "catalog:lessonTitleRequired": "lessonTitleRequired",
  "catalog:timeRequired": "timeRequired",
  "catalog:timeInvalid": "timeInvalid",
  "catalog:windowInvalid": "windowInvalid",
  "catalog:endMustBeFuture": "endMustBeFuture",
  "catalog:priceMustBeInteger": "priceMustBeInteger",
} as const;

/** Converts a schema issue into localized editor copy. @param value React Hook Form error. @param translate Catalog translation function. @returns Localized validation message when the key is recognized. */
export function lessonValidationMessage(
  value: unknown,
  translate: TFunction<"catalog">,
): string | undefined {
  if (typeof value !== "object" || value === null || !("message" in value)) return undefined;
  const message = value.message;
  if (typeof message !== "string" || !(message in LESSON_VALIDATION_KEYS)) return undefined;
  return translate(LESSON_VALIDATION_KEYS[message as keyof typeof LESSON_VALIDATION_KEYS]);
}
