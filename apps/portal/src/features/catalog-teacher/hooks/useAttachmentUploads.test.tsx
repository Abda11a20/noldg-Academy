import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";
import { ToastProvider, UiProvider } from "@noldg/ui";
import i18n from "../../../shared/i18n";
import { useAttachmentUploads } from "./useAttachmentUploads";
import { ATTACHMENT_COUNT_LIMIT, DEFAULT_UPLOAD_LIMITS } from "../constants";

function makeFileList(files: File[]): FileList {
  return Object.assign(files, {
    item: (index: number) => files[index] ?? null,
  }) as unknown as FileList;
}

function TestProviders({ children }: PropsWithChildren) {
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

describe("useAttachmentUploads", () => {
  it("uploads accepted files and keeps only their opaque upload tokens", async () => {
    const file = new File(["document"], "guide.pdf", { type: "application/pdf" });
    const hook = renderHook(() => useAttachmentUploads("course-general-secondary-1"), {
      wrapper: TestProviders,
    });
    act(() => hook.result.current.addFiles(makeFileList([file])));
    await waitFor(() => expect(hook.result.current.uploadTokens).toEqual(["mock-upload-token"]));
    expect(hook.result.current.files).toHaveLength(1);
    hook.unmount();
  });

  it("rejects unsupported file types before requesting a ticket", () => {
    const file = new File(["content"], "guide.txt", { type: "text/plain" });
    const hook = renderHook(() => useAttachmentUploads("course-general-secondary-1"), {
      wrapper: TestProviders,
    });
    act(() => hook.result.current.addFiles(makeFileList([file])));
    expect(hook.result.current.rejectedCount).toBe(1);
    expect(hook.result.current.uploadTokens).toEqual([]);
    hook.unmount();
  });

  it("rejects oversized attachments before requesting a ticket", () => {
    const file = new File(["document"], "guide.pdf", { type: "application/pdf" });
    Object.defineProperty(file, "size", { value: DEFAULT_UPLOAD_LIMITS.attachmentBytes + 1 });
    const hook = renderHook(() => useAttachmentUploads("course-general-secondary-1"), {
      wrapper: TestProviders,
    });
    act(() => hook.result.current.addFiles(makeFileList([file])));
    expect(hook.result.current.rejectedCount).toBe(1);
    expect(hook.result.current.files).toHaveLength(0);
    hook.unmount();
  });

  it("enforces the attachment count limit", () => {
    const files = Array.from(
      { length: ATTACHMENT_COUNT_LIMIT + 1 },
      (_, index) => new File([String(index)], `guide-${index}.pdf`, { type: "application/pdf" }),
    );
    const hook = renderHook(() => useAttachmentUploads("course-general-secondary-1"), {
      wrapper: TestProviders,
    });
    act(() => hook.result.current.addFiles(makeFileList(files)));
    expect(hook.result.current.files).toHaveLength(ATTACHMENT_COUNT_LIMIT);
    expect(hook.result.current.rejectedCount).toBe(1);
    hook.unmount();
  });
});
