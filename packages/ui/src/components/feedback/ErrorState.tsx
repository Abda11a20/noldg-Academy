import type { ReactNode } from "react";
import { Button } from "../button/Button";
import { Alert } from "./Alert";
export interface ErrorStateProps {
  title: string;
  description: string;
  retryLabel?: string;
  onRetry?: () => void;
  action?: ReactNode;
}
/** Presents a normalized, user-safe error message with an optional retry control. @param props Safe copy and retry action. */
export function ErrorState({ title, description, retryLabel, onRetry, action }: ErrorStateProps) {
  const retry =
    onRetry && retryLabel ? (
      <Button onClick={onRetry} variant="secondary">
        {retryLabel}
      </Button>
    ) : (
      action
    );
  return (
    <Alert tone="danger" title={title} action={retry}>
      {description}
    </Alert>
  );
}
