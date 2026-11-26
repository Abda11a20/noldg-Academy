import { act, type PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { ToastProvider, UiProvider } from "@noldg/ui";
import { expect, it } from "vitest";
import i18n from "../../../shared/i18n";
import { renderHook } from "../../../shared/testing/render-hook";
import { useCheckoutFlow } from "./useCheckoutFlow";

function Wrapper({ children }: PropsWithChildren): React.ReactElement {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
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

it("normalizes sender numbers and advances checkout through a stable confirmation flow", () => {
  const hook = renderHook(() => useCheckoutFlow("package-test"), { wrapper: Wrapper });
  expect(hook.result.step).toBe(1);
  expect(hook.result.isSenderValid).toBe(false);
  act(() => hook.result.setSenderRef("٠١٠١٢٣٤٥٦٧٨"));
  expect(hook.result.isSenderValid).toBe(true);
  act(() => hook.result.changeStep(2));
  expect(hook.result.step).toBe(2);
});
