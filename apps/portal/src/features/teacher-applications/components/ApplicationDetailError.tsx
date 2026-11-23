import { AppError } from "@noldg/api/errors";
import { ErrorState } from "@noldg/ui";

interface ApplicationDetailErrorProps {
  error: unknown;
  labels: {
    forbiddenTitle: string;
    forbiddenBody: string;
    unavailableTitle: string;
    unavailableBody: string;
    detailUnavailable: string;
    retry: string;
  };
  onRetry: () => void;
}

/** Renders a normalized permission or availability message for application detail failures.
 * @param props Error, translated messages, and retry event.
 */
export function ApplicationDetailError({ error, labels, onRetry }: ApplicationDetailErrorProps) {
  const forbidden = error instanceof AppError && error.status === 403;
  const unavailable = error instanceof AppError && error.status === 501;
  const description = forbidden
    ? labels.forbiddenBody
    : unavailable
      ? labels.detailUnavailable
      : labels.unavailableBody;
  return (
    <ErrorState
      title={forbidden ? labels.forbiddenTitle : labels.unavailableTitle}
      description={description}
      retryLabel={labels.retry}
      onRetry={onRetry}
    />
  );
}
