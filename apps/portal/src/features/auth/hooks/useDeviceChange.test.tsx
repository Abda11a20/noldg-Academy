import { act, type PropsWithChildren } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { renderHook } from "../../../shared/testing/render-hook";
import { useDeviceChange } from "./useDeviceChange";

function RouterWrapper({ children }: PropsWithChildren) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe("useDeviceChange", () => {
  it("treats a missing request as an empty status", async () => {
    const hook = renderHook(() => useDeviceChange(), { wrapper: RouterWrapper });
    await act(async () => hook.result.loadStatus());
    expect(hook.result.status).toBeUndefined();
    expect(hook.result.errorKey).toBeNull();
  });

  it("creates a request and clears its reason after success", async () => {
    const hook = renderHook(() => useDeviceChange(), { wrapper: RouterWrapper });
    act(() => hook.result.setReason("I changed my phone."));
    await act(async () => hook.result.createRequest());
    expect(hook.result.status).toBe("pending");
    expect(hook.result.reason).toBe("");
    expect(hook.result.pending).toBe(false);
  });
});
