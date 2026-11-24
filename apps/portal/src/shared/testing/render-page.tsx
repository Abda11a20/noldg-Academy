import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { Link as RouterLink, MemoryRouter } from "react-router";
import { ToastProvider, UiProvider, type UiLinkProps } from "@noldg/ui";
import i18n from "../i18n";

function TestRouterLink(props: UiLinkProps) {
  return <RouterLink {...props} />;
}

/** Renders a portal page with its normal query, router, locale, and UI contexts.
 * @param children Page component tree.
 * @param options Testing Library render options.
 * @returns Mounted page queries and unmount helpers.
 */
export function renderPage(
  children: ReactNode,
  options?: Omit<RenderOptions, "wrapper">,
  initialEntries?: string[],
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter {...(initialEntries ? { initialEntries } : {})}>
          <UiProvider direction="ltr" linkComponent={TestRouterLink}>
            <ToastProvider dismissLabel={i18n.t("common:toastDismiss")}>{children}</ToastProvider>
          </UiProvider>
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
    options,
  );
}
