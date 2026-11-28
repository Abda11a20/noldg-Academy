import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { AppError } from "@noldg/api/errors";
import { useToast } from "@noldg/ui";
import { useApiErrorToast } from "../../../shared/errors/useApiErrorToast";

const ASSESSMENT_ERROR_CODES = new Set([
  "ASSESSMENT_LOCKED",
  "ASSESSMENT_WINDOW_INVALID",
  "POOL_TOO_SMALL",
  "NO_QUESTIONS",
  "QUESTION_INVALID",
  "QUESTION_IN_USE",
  "TARGET_STUDENT_INVALID",
]);

/** Resolves a localized assessment error message from a normalized API error.
 * @param error Thrown API or validation error.
 * @param t Assessments translation function.
 * @returns Localized message when the error matches a known assessment error code, otherwise null.
 */
function getAssessmentErrorMessage(
  error: unknown,
  t: ReturnType<typeof useTranslation<"assessments">>["t"],
): string | null {
  if (!(error instanceof AppError) || !ASSESSMENT_ERROR_CODES.has(error.code)) return null;
  return t(`errors.${error.code}` as never);
}

/** Reports assessment API errors using the lazy assessments namespace before falling back to shared errors. */
export function useAssessmentErrorToast() {
  const { notify } = useToast();
  const { t } = useTranslation("assessments");
  const reportSharedError = useApiErrorToast();
  return useCallback(
    (error: unknown) => {
      const message = getAssessmentErrorMessage(error, t);
      if (message) {
        notify({ title: message, tone: "danger" });
        return;
      }
      reportSharedError(error);
    },
    [notify, reportSharedError, t],
  );
}
