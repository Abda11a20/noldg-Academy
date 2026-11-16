import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { useDocumentLanguage } from "../shared/i18n/useDocumentLanguage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function DocumentLanguageSync() {
  useDocumentLanguage();
  return null;
}

export interface ProvidersProps {
  children: ReactNode;
}

/** Composes shared data, locale direction, and render-error providers. */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <DocumentLanguageSync />
      <ErrorBoundary>{children}</ErrorBoundary>
    </QueryClientProvider>
  );
}
