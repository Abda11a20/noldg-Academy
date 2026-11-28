import { useCallback } from "react";
import { AppError } from "@noldg/api/errors";
import { useToast } from "@noldg/ui";
import { useTranslation } from "react-i18next";

const CATALOG_ERROR_KEYS: Record<string, string> = {
  LESSON_NOT_PUBLISHABLE: "lessonNotPublishable",
  WINDOW_INVALID: "lessonWindowInvalid",
  WINDOW_SHORTEN_FORBIDDEN: "lessonWindowShortenForbidden",
  WINDOW_START_LOCKED: "lessonWindowStartLocked",
  UPLOAD_EXPIRED: "uploadExpired",
  UPLOAD_REJECTED: "uploadRejected",
  FILE_TOO_LARGE: "uploadFileTooLarge",
  FILE_TYPE_NOT_ALLOWED: "uploadFileTypeNotAllowed",
};

const ORDER_ERROR_KEYS: Record<string, string> = {
  ORDER_ALREADY_OPEN: "orderAlreadyOpen",
  PRODUCT_NOT_PURCHASABLE: "productNotPurchasable",
  PRODUCT_ALREADY_OWNED: "productAlreadyOwned",
  TOO_MANY_OPEN_ORDERS: "tooManyOpenOrders",
  ORDER_EXPIRED: "orderExpired",
  ORDER_ALREADY_PROCESSED: "orderAlreadyProcessed",
  ORDER_NOT_CANCELLABLE: "orderNotCancellable",
  ORDER_PAYMENT_SUBMISSION_FAILED: "orderPaymentSubmissionFailed",
};

/** Reports a normalized, localized API error through the shared toast queue.
 * @returns Function accepting an unknown request failure; raw server text is never rendered.
 */
export function useApiErrorToast() {
  const { notify } = useToast();
  const { t } = useTranslation(["errors", "common"]);
  return useCallback(
    (error: unknown) => {
      const key =
        error instanceof AppError
          ? (ORDER_ERROR_KEYS[error.code] ??
            CATALOG_ERROR_KEYS[error.code] ??
            (error.code === "DUPLICATE_TRACK"
              ? "duplicateTrack"
              : error.message_key.replace("errors:", "")))
          : "requestFailed";
      notify({
        title: t(`errors:${key}`, { defaultValue: t("errors:requestFailed") }),
        tone: "danger",
      });
    },
    [notify, t],
  );
}
