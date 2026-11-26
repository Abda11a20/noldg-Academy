import { afterEach } from "vitest";
import { cleanupHooks } from "../src/shared/testing/render-hook";
import { resetOrderMockState } from "@noldg/api/mocks/testing";
import {
  DEFERRED_ROUTE_NAMESPACES,
  loadRouteNamespace,
} from "../src/shared/i18n/load-route-namespace";

await Promise.all(DEFERRED_ROUTE_NAMESPACES.map(loadRouteNamespace));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => undefined;
}
if (!("hasPointerCapture" in Element.prototype)) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => undefined;
  Element.prototype.releasePointerCapture = () => undefined;
}

afterEach(() => {
  cleanupHooks();
  resetOrderMockState();
});
