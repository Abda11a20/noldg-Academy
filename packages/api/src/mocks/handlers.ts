import type { RequestHandler } from "msw";
import { authHandlers } from "./handlers/auth";

/** Initial mock handler list; domain handlers are added with their API modules. */
export const handlers: RequestHandler[] = [...authHandlers];
