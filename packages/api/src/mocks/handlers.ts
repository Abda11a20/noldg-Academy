import type { RequestHandler } from "msw";
import { authHandlers } from "./handlers/auth";
import { adminHandlers } from "./handlers/admin";
import { catalogHandlers } from "./handlers/catalog";
import { browseHandlers } from "./handlers/browse";

/** Initial mock handler list; domain handlers are added with their API modules. */
export const handlers: RequestHandler[] = [
  ...authHandlers,
  ...adminHandlers,
  ...catalogHandlers,
  ...browseHandlers,
];
