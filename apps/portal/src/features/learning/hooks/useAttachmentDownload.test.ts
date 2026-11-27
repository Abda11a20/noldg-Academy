import { act, cleanup, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse, nodeServer } from "@noldg/api/mocks/testing";
import { API_BASE_URL } from "@noldg/api/constants/http";
import { afterEach, expect, it, vi } from "vitest";
import { createElement } from "react";
import { useAttachmentDownload } from "./useAttachmentDownload";

afterEach(cleanup);

it("opens the URL only after the API returns the short-lived attachment link", async () => {
  const navigate = vi.fn();
  nodeServer.use(
    http.get(`${API_BASE_URL}/lessons/lesson-one/attachments/file-one/download`, () =>
      HttpResponse.json({ url: "https://media.example.test/file.pdf" }),
    ),
  );
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false, gcTime: 0 } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const hook = renderHook(() => useAttachmentDownload("lesson-one", navigate), { wrapper });
  await act(async () => {
    await hook.result.current.mutateAsync("file-one");
  });
  expect(navigate).toHaveBeenCalledWith("https://media.example.test/file.pdf");
  queryClient.clear();
});
