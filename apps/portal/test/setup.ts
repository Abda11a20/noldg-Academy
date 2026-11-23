import { afterEach } from "vitest";
import { cleanupHooks } from "../src/shared/testing/render-hook";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

afterEach(cleanupHooks);
