import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";
import { ToastProvider, UiProvider } from "@noldg/ui";
import i18n from "../../../shared/i18n";
import { useCatalogMutations } from "./useCatalogMutations";

function Providers({ children }: PropsWithChildren) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return (
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <UiProvider direction="ltr">
          <ToastProvider dismissLabel={i18n.t("common:toastDismiss")}>{children}</ToastProvider>
        </UiProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

describe("useCatalogMutations", () => {
  it("saves a lesson and exposes pending state until the API responds", async () => {
    const hook = renderHook(() => useCatalogMutations("course-general-secondary-1"), {
      wrapper: Providers,
    });
    let lessonId = "";
    await act(async () => {
      const result = await hook.result.current.saveLesson({
        title: "Mutation hook lesson",
        description: "Lesson body",
        kind: "recorded",
        status: "draft",
        availableFrom: "2027-01-01T00:00:00.000Z",
        availableUntil: "2027-02-01T00:00:00.000Z",
        access: "free",
      });
      lessonId = result?.id ?? "";
    });
    await waitFor(() => expect(hook.result.current.isSavingLesson).toBe(false));
    expect(lessonId).not.toBe("");
    hook.unmount();
  });
});
