import { ErrorState } from "@noldg/ui";
import { useTranslation } from "react-i18next";
import { retryAuthSession, useAuthSnapshot } from "../../shared/auth/auth-store";

/** Shows a localized retry action without discarding a session during transient failures. */
export function SessionUnavailable() {
  const { error } = useAuthSnapshot();
  const { t } = useTranslation(["common", "errors"]);
  const descriptionKey =
    error?.code === "NETWORK_ERROR"
      ? "networkError"
      : error?.code === "TIMEOUT"
        ? "requestTimeout"
        : "requestFailed";
  return (
    <main className="mx-auto max-w-prose px-4 py-12">
      <ErrorState
        title={t("errors:requestFailed")}
        description={t(`errors:${descriptionKey}`)}
        retryLabel={t("common:retry")}
        onRetry={() => void retryAuthSession()}
      />
    </main>
  );
}
