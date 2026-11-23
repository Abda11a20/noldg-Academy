import type { FieldError } from "react-hook-form";
import { translateFieldError } from "./translate-field-error";

/** Returns UI error props only when a form field has a safe translated validation message. @param error React Hook Form field error. */
export function fieldErrorProps(error: FieldError | undefined): { error?: string } {
  if (!error) return {};
  return { error: translateFieldError(error.message) };
}
