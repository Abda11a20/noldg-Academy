import { Component, type ReactNode } from "react";
import i18n from "../shared/i18n";

interface ErrorBoundaryProps {
  children: ReactNode;
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

  override render() {
    return this.state.hasError ? (
      <main className="mx-auto max-w-prose px-4 py-12 text-center">
        <h1 className="text-xl font-semibold">{i18n.t("errors:requestFailed")}</h1>
      </main>
    ) : (
      this.props.children
    );
  }
}
