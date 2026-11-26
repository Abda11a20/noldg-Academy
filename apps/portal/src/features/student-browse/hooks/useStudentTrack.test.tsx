import { act, type PropsWithChildren } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { renderHook } from "../../../shared/testing/render-hook";
import { useStudentTrack } from "./useStudentTrack";

function routerAt(path: string) {
  return function RouterWrapper({ children }: PropsWithChildren) {
    return <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>;
  };
}

describe("useStudentTrack", () => {
  it("restores a valid manual track from the URL and updates it", () => {
    const hook = renderHook(() => useStudentTrack(), {
      wrapper: routerAt("/student/teachers?trackId=track-azhar-secondary-1"),
    });
    expect(hook.result.trackId).toBe("track-azhar-secondary-1");
    expect(hook.result.manual).toBe(true);
    act(() => hook.result.setTrack("track-secondary-1"));
    expect(hook.result.trackId).toBe("track-secondary-1");
    hook.unmount();
  });

  it("ignores an invalid URL track and removes it when an invalid choice is set", () => {
    const hook = renderHook(() => useStudentTrack(), {
      wrapper: routerAt("/student/teachers?trackId=unknown"),
    });
    expect(hook.result.trackId).toBeUndefined();
    act(() => hook.result.setTrack("unknown"));
    expect(hook.result.trackId).toBeUndefined();
    hook.unmount();
  });
});
