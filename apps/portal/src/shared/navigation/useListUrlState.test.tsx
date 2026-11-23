import { act } from "react";
import { MemoryRouter } from "react-router";
import type { PropsWithChildren } from "react";
import { expect, it, vi } from "vitest";
import { renderHook } from "../testing/render-hook";
import { useListUrlState } from "./useListUrlState";

function createWrapper(initialEntries: string[]) {
  return function RouterWrapper({ children }: PropsWithChildren) {
    return <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;
  };
}

it("falls back on invalid URL parameters and writes debounced search state", async () => {
  vi.useFakeTimers();
  const hook = renderHook(() => useListUrlState(), {
    wrapper: createWrapper(["/?page=0&pageSize=invalid&filters=%7Bbad"]),
  });
  expect(hook.result.state).toMatchObject({ page: 1, pageSize: 20, search: "", filters: {} });
  act(() => hook.result.setSearch("physics"));
  await act(async () => {
    vi.advanceTimersByTime(300);
  });
  expect(hook.result.state.search).toBe("physics");
  hook.unmount();
  vi.useRealTimers();
});
