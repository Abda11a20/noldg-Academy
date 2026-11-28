import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { ToastProvider, UiProvider, type UiLinkProps } from "@noldg/ui";
import { createMemoryRouter, Link as RouterLink, RouterProvider } from "react-router";
import i18n from "../../../shared/i18n";
import { AssessmentBuilderPage } from "./AssessmentBuilderPage";

function TestRouterLink(props: UiLinkProps) {
  return <RouterLink {...props} />;
}

/** Mounts AssessmentBuilderPage inside a data router so useBlocker works in unit tests. */
export function renderBuilder(initialPath: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      {
        path: "/teacher/courses/:courseId/assessments/new/:type",
        element: <AssessmentBuilderPage />,
      },
      {
        path: "/teacher/courses/:courseId/assessments/:assessmentId/:action",
        element: <AssessmentBuilderPage />,
      },
      { path: "/teacher/courses/:courseId", element: <div data-testid="course-home" /> },
    ],
    { initialEntries: [initialPath] },
  );
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <UiProvider direction="ltr" linkComponent={TestRouterLink}>
          <ToastProvider dismissLabel={i18n.t("common:toastDismiss")}>
            <RouterProvider router={router} />
          </ToastProvider>
        </UiProvider>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}
