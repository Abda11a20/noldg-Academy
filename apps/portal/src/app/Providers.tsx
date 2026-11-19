import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ComponentType, ReactNode } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { useDocumentLanguage } from "../shared/i18n/useDocumentLanguage";
import { Link as RouterLink } from "react-router";
import { UiProvider, type UiLinkProps } from "@noldg/ui";
import { useTranslation } from "react-i18next";

function PortalRouterLink(props: UiLinkProps) {
  return <RouterLink {...props} />;
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function DocumentLanguageSync() {
  useDocumentLanguage();
  return null;
}

function PortalUiProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const direction = i18n.resolvedLanguage?.startsWith("ar") ? "rtl" : "ltr";
  const linkComponent: ComponentType<UiLinkProps> = PortalRouterLink;
  return (
    <UiProvider direction={direction} linkComponent={linkComponent}>
      {children}
    </UiProvider>
  );
}

export interface ProvidersProps {
  children: ReactNode;
}

/** Composes shared data, locale direction, and render-error providers. */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <DocumentLanguageSync />
      <ErrorBoundary>
        <PortalUiProvider>{children}</PortalUiProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
