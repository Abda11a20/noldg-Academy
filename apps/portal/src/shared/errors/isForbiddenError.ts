import { AppError } from "@noldg/api/errors";

/** Identifies normalized permission failures so list pages can show a safe access state.
 * @param error Unknown request result or thrown value.
 */
export function isForbiddenError(error: unknown): boolean {
  return error instanceof AppError && error.status === 403;
}
