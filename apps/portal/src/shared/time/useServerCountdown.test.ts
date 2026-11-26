import { renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useServerCountdown } from "./useServerCountdown";

afterEach(() => vi.useRealTimers());

it("starts and cleans up the display interval on unmount", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-28T09:00:00Z"));
  const { result, unmount } = renderHook(() =>
    useServerCountdown("2026-11-28T10:00:00Z", "2026-11-28T09:00:00Z", Date.now()),
  );
  expect(result.current).toBe(3600);
  expect(vi.getTimerCount()).toBe(1);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
