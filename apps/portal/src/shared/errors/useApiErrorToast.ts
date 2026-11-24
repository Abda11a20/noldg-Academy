import { useCallback } from "react";
import { AppError } from "@noldg/api/errors";
import { useToast } from "@noldg/ui";
import { useTranslation } from "react-i18next";

/** Reports a normalized, localized API error through the shared toast queue.
 * @returns Function accepting an unknown request failure; raw server text is never rendered.
 */
export function useApiErrorToast() {
  const { notify } = useToast();
  const { t } = useTranslation(["errors", "common"]);
  return useCallback(
    (error: unknown) => {
      const key =
        error instanceof AppError && error.code === "DUPLICATE_TRACK"
          ? "duplicateTrack"
          : error instanceof AppError
            ? error.message_key.replace("errors:", "")
            : "requestFailed";
      notify({
        title: t(`errors:${key}`, { defaultValue: t("errors:requestFailed") }),
        tone: "danger",
      });
    },
    [notify, t],
  );
}
