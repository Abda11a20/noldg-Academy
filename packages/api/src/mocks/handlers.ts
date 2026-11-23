import type { RequestHandler } from "msw";
import { authHandlers } from "./handlers/auth";
import { adminHandlers } from "./handlers/admin";

/** Initial mock handler list; domain handlers are added with their API modules. */
export const handlers: RequestHandler[] = [...authHandlers, ...adminHandlers];
