import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/** Browser service worker used when `VITE_API_MODE=mock`. */
export const browserWorker = setupWorker(...handlers);
