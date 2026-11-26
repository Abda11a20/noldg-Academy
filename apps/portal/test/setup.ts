import { afterEach } from "vitest";
import { cleanupHooks } from "../src/shared/testing/render-hook";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => undefined;
}
if (!("hasPointerCapture" in Element.prototype)) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => undefined;
  Element.prototype.releasePointerCapture = () => undefined;
}

afterEach(cleanupHooks);
