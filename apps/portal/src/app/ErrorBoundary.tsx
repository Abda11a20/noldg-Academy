import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@noldg/ui";
import i18n from "../shared/i18n";

interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Catches unexpected render errors and shows a translated, user-safe fallback. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  override render() {
    return this.state.hasError ? (
      <main className="mx-auto max-w-prose px-4 py-12 text-center">
        <h1 className="text-xl font-semibold">{i18n.t("errors:requestFailed")}</h1>
        <div className="mt-6 flex justify-center">
          <Button onClick={() => window.location.reload()}>{i18n.t("common:retry")}</Button>
        </div>
      </main>
    ) : (
      this.props.children
    );
  }
}
