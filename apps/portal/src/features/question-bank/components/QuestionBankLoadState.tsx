import { AppError } from "@noldg/api/errors";
import { ErrorState, Heading, Skeleton } from "@noldg/ui";
import type { QuestionBankLabels } from "../types";

export interface QuestionBankLoadStateProps {
  pending: boolean;
  error: Error | null;
  labels: QuestionBankLabels;
  onRetry: () => void;
}

/** Shows a neutral loading state or a safe retry/permission state for question data.
 * @param props Query status, localized copy, and retry event.
 */
export function QuestionBankLoadState({
  pending,
  error,
  labels,
  onRetry,
}: QuestionBankLoadStateProps) {
  if (pending)
    return (
      <section className="space-y-4">
        <Heading level={1}>{labels.title}</Heading>
        <Skeleton className="h-12" />
        <Skeleton className="h-48" />
      </section>
    );
  return (
    <ErrorState
      title={labels.loadError}
      description={
        error instanceof AppError && error.status === 403
          ? labels.permissionDenied
          : labels.loadError
      }
      retryLabel={labels.retry}
      onRetry={onRetry}
    />
  );
}
