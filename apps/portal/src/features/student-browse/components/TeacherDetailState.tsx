import { useTranslation } from "react-i18next";
import { AppError } from "@noldg/api/errors";
import { ErrorState, Skeleton } from "@noldg/ui";
import { isForbiddenError } from "../../../shared/errors/isForbiddenError";

interface TeacherDetailStateProps {
  pending: boolean;
  error: unknown;
  onRetry: () => void;
}

/** Renders the teacher detail loading, permission, not-found, and retry states. */
export function TeacherDetailState({ pending, error, onRetry }: TeacherDetailStateProps) {
  const { t } = useTranslation(["browse", "common"]);
  if (pending) return <Skeleton className="h-80" />;
  if (!error) return null;
  if (isForbiddenError(error))
    return <ErrorState title={t("forbiddenTitle")} description={t("forbiddenDescription")} />;
  const missing = error instanceof AppError && error.status === 404;
  return (
    <ErrorState
      title={t(missing ? "teacherMissingTitle" : "loadErrorTitle")}
      description={t(missing ? "teacherMissingDescription" : "loadErrorDescription")}
      {...(!missing ? { retryLabel: t("common:retry"), onRetry } : {})}
    />
  );
}
