import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ComponentType, ReactNode } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { useDocumentLanguage } from "../shared/i18n/useDocumentLanguage";
import { Link as RouterLink } from "react-router";
import { ToastProvider, UiProvider, type UiLinkProps } from "@noldg/ui";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { AUTH_LOGOUT_EVENT } from "@noldg/api/auth/events";
import { AppError } from "@noldg/api/errors";
import { clearAuthSession, initializeAuthSession } from "../shared/auth/auth-store";

function PortalRouterLink(props: UiLinkProps) {
  return <RouterLink {...props} />;
}

const QUERY_STALE_TIME_MS = 30_000;

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false;
  if (
    error instanceof AppError &&
    ((error.status >= 400 && error.status < 500) || error.status === 501)
  ) {
    return false;
  }
  return true;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      staleTime: QUERY_STALE_TIME_MS,
      refetchOnWindowFocus: false,
    },
  },
});

function DocumentLanguageSync() {
  useDocumentLanguage();
  return null;
}

function AuthSessionInitializer() {
  useEffect(() => {
    void initializeAuthSession();
    const clearExpiredSession = () => {
      clearAuthSession();
      queryClient.clear();
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, clearExpiredSession);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, clearExpiredSession);
  }, []);
  return null;
}

function PortalUiProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const direction = i18n.resolvedLanguage?.startsWith("ar") ? "rtl" : "ltr";
  const linkComponent: ComponentType<UiLinkProps> = PortalRouterLink;
  return (
    <UiProvider direction={direction} linkComponent={linkComponent}>
      <ToastProvider
        dismissLabel={i18n.t("common:toastDismiss")}
        regionLabel={i18n.t("common:notificationsRegion")}
      >
        {children}
      </ToastProvider>
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
      <AuthSessionInitializer />
      <ErrorBoundary>
        <PortalUiProvider>{children}</PortalUiProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
