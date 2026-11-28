import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { API_BASE_URL } from "@noldg/api/constants/http";
import { http, HttpResponse, nodeServer } from "@noldg/api/mocks/testing";
import { MOCK_COURSE_STUDENTS, MOCK_QUESTIONS } from "@noldg/api/mocks/fixtures/assessments";
import { ToastProvider, UiProvider, type UiLinkProps } from "@noldg/ui";
import { afterEach, beforeEach, expect, it } from "vitest";
import { createMemoryRouter, Link as RouterLink, RouterProvider } from "react-router";
import i18n from "../../../shared/i18n";
import { loadRouteNamespace } from "../../../shared/i18n/load-route-namespace";
import { AssessmentBuilderPage } from "./AssessmentBuilderPage";

function TestRouterLink(props: UiLinkProps) {
  return <RouterLink {...props} />;
}

function renderBuilder(initialPath: string) {
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
        path: "/teacher/courses/:courseId/assessments/:assessmentId/edit",
        element: <AssessmentBuilderPage />,
      },
      { path: "/teacher/courses/:courseId", element: <div>{"course-home"}</div> },
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

beforeEach(async () => {
  await i18n.changeLanguage("en");
  await loadRouteNamespace("assessments");
});
afterEach(cleanup);

it("creates an exam draft with selected question IDs and Cairo UTC windows", async () => {
  let submitted: unknown;
  nodeServer.use(
    http.get(`${API_BASE_URL}/questions/my`, () =>
      HttpResponse.json({ items: [MOCK_QUESTIONS[0]], page: 1, pageSize: 100, total: 1 }),
    ),
    http.get(`${API_BASE_URL}/assessments/courses/:courseId/students`, () =>
      HttpResponse.json({ items: MOCK_COURSE_STUDENTS }),
    ),
    http.get(`${API_BASE_URL}/assessments/courses/:courseId`, () =>
      HttpResponse.json({ items: [], page: 1, pageSize: 20, total: 0 }),
    ),
    http.post(`${API_BASE_URL}/assessments`, async ({ request }) => {
      submitted = await request.json();
      return HttpResponse.json(
        { ...(submitted as object), id: "created-assessment", status: "draft", attemptCount: 0 },
        { status: 201 },
      );
    }),
  );
  renderBuilder("/teacher/courses/course-1/assessments/new/exam");
  fireEvent.change(await screen.findByLabelText("Title"), { target: { value: "Unit exam" } });
  fireEvent.change(screen.getByLabelText("Opens at"), { target: { value: "2026-12-01T12:00" } });
  fireEvent.change(screen.getByLabelText("Closes at"), { target: { value: "2026-12-01T14:00" } });
  fireEvent.click(screen.getByLabelText(MOCK_QUESTIONS[0]!.text));
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  await waitFor(() =>
    expect(submitted).toMatchObject({
      type: "exam",
      courseId: "course-1",
      title: "Unit exam",
      questionIds: [MOCK_QUESTIONS[0]!.id],
      windowStart: expect.stringMatching(/Z$/),
      windowEnd: expect.stringMatching(/Z$/),
      durationMinutes: 60,
      maxAttempts: 1,
    }),
  );
});
