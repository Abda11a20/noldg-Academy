import { Button } from "../button/Button";
import { ProgressBar } from "../feedback/ProgressBar";

export interface FileRowProps {
  name: string;
  sizeLabel: string;
  statusLabel: string;
  progressLabel: string;
  progress?: number;
  removeLabel?: string;
  retryLabel?: string;
  onRemove?: () => void;
  onRetry?: () => void;
  disabled?: boolean;
}

/** Displays a selected or uploading file with status and optional remove/retry actions. @param props File display values and action callbacks. */
export function FileRow({
  name,
  sizeLabel,
  statusLabel,
  progressLabel,
  progress,
  removeLabel,
  retryLabel,
  onRemove,
  onRetry,
  disabled = false,
}: FileRowProps) {
  const metadata = `${sizeLabel} · ${statusLabel}`;
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{name}</p>
          <p className="text-sm text-foreground-muted">{metadata}</p>
        </div>
        <div className="flex items-center gap-2">
          {retryLabel && onRetry ? (
            <Button disabled={disabled} onClick={onRetry} size="sm" variant="secondary">
              {retryLabel}
            </Button>
          ) : null}
          {removeLabel && onRemove ? (
            <Button disabled={disabled} onClick={onRemove} size="sm" variant="ghost">
              {removeLabel}
            </Button>
          ) : null}
        </div>
      </div>
      {progress === undefined ? null : <ProgressBar label={progressLabel} value={progress} />}
    </div>
  );
}
