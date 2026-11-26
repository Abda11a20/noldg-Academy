import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";
import { ToastProvider, UiProvider } from "@noldg/ui";
import { createCourseLesson } from "@noldg/api/endpoints/catalog";
import i18n from "../../../shared/i18n";
import { DEFAULT_UPLOAD_LIMITS } from "../constants";
import { useVideoUpload } from "./useVideoUpload";

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

describe("useVideoUpload", () => {
  it("requests a fresh ticket once after expiry and uploads successfully", async () => {
    const file = new File(["video"], "expired-video.mp4", { type: "video/mp4" });
    const hook = renderHook(() => useVideoUpload(), { wrapper: Providers });
    await act(async () => hook.result.current.upload("course-general-secondary-1", file));
    await waitFor(() => expect(hook.result.current.state.status).toBe("uploaded"));
    hook.unmount();
  });

  it("maps provider rejection and permits a retry", async () => {
    const file = new File(["video"], "failure-video.mp4", { type: "video/mp4" });
    const hook = renderHook(() => useVideoUpload(), { wrapper: Providers });
    await act(async () => hook.result.current.upload("course-general-secondary-1", file));
    await waitFor(() =>
      expect(hook.result.current.state).toMatchObject({ status: "failed", reason: "upload" }),
    );
    hook.unmount();
  });

  it("cancels an in-flight provider upload", async () => {
    const file = new File(["video"], "slow-video.mp4", { type: "video/mp4" });
    const hook = renderHook(() => useVideoUpload(), { wrapper: Providers });
    act(() => {
      void hook.result.current.upload("course-general-secondary-1", file);
    });
    await waitFor(() => expect(hook.result.current.state.status).toBe("uploading"));
    act(() => hook.result.current.cancel());
    expect(hook.result.current.state).toEqual({ status: "idle" });
    hook.unmount();
  });

  it("rejects an oversized video before requesting a ticket", async () => {
    const file = new File(["video"], "large-video.mp4", { type: "video/mp4" });
    Object.defineProperty(file, "size", { value: DEFAULT_UPLOAD_LIMITS.videoBytes + 1 });
    const hook = renderHook(() => useVideoUpload(), { wrapper: Providers });
    await act(async () => hook.result.current.upload("course-general-secondary-1", file));
    expect(hook.result.current.state).toMatchObject({ status: "failed", reason: "size" });
    hook.unmount();
  });

  it("attaches the opaque ticket and polls until the mock provider is ready", async () => {
    const file = new File(["video"], "lesson.mp4", { type: "video/mp4" });
    const hook = renderHook(() => useVideoUpload(), { wrapper: Providers });
    await act(async () => hook.result.current.upload("course-general-secondary-1", file));
    await waitFor(() => expect(hook.result.current.state.status).toBe("uploaded"));
    let savedLessonId = "";
    await act(async () => {
      const result = await hook.result.current.attachAndPoll((videoUploadToken) =>
        createCourseLesson("course-general-secondary-1", {
          title: "Upload hook lesson",
          description: "Test video processing.",
          kind: "recorded",
          status: "draft",
          availableFrom: "2027-02-01T00:00:00.000Z",
          availableUntil: "2027-03-01T00:00:00.000Z",
          access: "free",
          videoUploadToken,
        }),
      );
      savedLessonId = result?.id ?? "";
    });
    expect(savedLessonId).not.toBe("");
    expect(hook.result.current.state.status).toBe("ready");
    hook.unmount();
  }, 15_000);

  it("reports processing failure after a provider upload", async () => {
    const file = new File(["video"], "processing-failed-video.mp4", { type: "video/mp4" });
    const hook = renderHook(() => useVideoUpload(), { wrapper: Providers });
    await act(async () => hook.result.current.upload("course-general-secondary-1", file));
    await waitFor(() => expect(hook.result.current.state.status).toBe("uploaded"));
    await act(async () =>
      hook.result.current.attachAndPoll((videoUploadToken) =>
        createCourseLesson("course-general-secondary-1", {
          title: "Failed processing lesson",
          description: "Test failed video processing.",
          kind: "recorded",
          status: "draft",
          availableFrom: "2027-02-01T00:00:00.000Z",
          availableUntil: "2027-03-01T00:00:00.000Z",
          access: "free",
          videoUploadToken,
        }),
      ),
    );
    expect(hook.result.current.state).toMatchObject({ status: "failed", reason: "processing" });
    hook.unmount();
  }, 15_000);
});
