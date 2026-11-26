import { act, createElement, Fragment, type ComponentType, type PropsWithChildren } from "react";
import { createRoot, type Root } from "react-dom/client";

const mountedRoots = new Map<Root, HTMLElement>();

interface RenderHookOptions {
  wrapper?: ComponentType<PropsWithChildren>;
}

interface RenderHookResult<TResult> {
  readonly result: TResult;
  rerender(): void;
  unmount(): void;
}

/** Mounts a hook in the portal DOM and supports an optional context wrapper. @param callback Hook callback to render. @param options Optional provider wrapper. */
export function renderHook<TResult>(
  callback: () => TResult,
  options: RenderHookOptions = {},
): RenderHookResult<TResult> {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const Wrapper = options.wrapper ?? Fragment;
  let currentResult!: TResult;
  const Probe = () => {
    currentResult = callback();
    return null;
  };
  const tree = createElement(Wrapper, null, createElement(Probe));
  mountedRoots.set(root, container);
  act(() => root.render(tree));
  return {
    get result() {
      return currentResult;
    },
    rerender() {
      act(() => root.render(tree));
    },
    unmount() {
      act(() => root.unmount());
      container.remove();
      mountedRoots.delete(root);
    },
  };
}

/** Unmounts hook roots after each test to isolate portal DOM and React state. */
export function cleanupHooks(): void {
  for (const [root, container] of mountedRoots) {
    act(() => root.unmount());
    container.remove();
    mountedRoots.delete(root);
  }
}
