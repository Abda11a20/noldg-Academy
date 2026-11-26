import { act, createElement, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCooldown } from "./useCooldown";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let currentValue: ReturnType<typeof useCooldown> | undefined;
let root: ReturnType<typeof createRoot> | undefined;
let host: HTMLDivElement | undefined;

function CooldownProbe() {
  const value = useCooldown();
  useEffect(() => {
    currentValue = value;
  }, [value]);
  return null;
}

afterEach(() => {
  if (root) act(() => root?.unmount());
  host?.remove();
  currentValue = undefined;
  root = undefined;
  host = undefined;
  vi.useRealTimers();
});

describe("useCooldown", () => {
  it("counts down and exposes whether an action can be retried", () => {
    vi.useFakeTimers();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    act(() => root?.render(createElement(CooldownProbe)));
    expect(currentValue?.canResend).toBe(true);
    act(() => currentValue?.startCooldown(2));
    expect(currentValue?.secondsRemaining).toBe(2);
    act(() => vi.advanceTimersByTime(2000));
    expect(currentValue?.secondsRemaining).toBe(0);
    expect(currentValue?.canResend).toBe(true);
  });
});
