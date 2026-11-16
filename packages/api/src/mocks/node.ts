import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/** Node request interceptor used by API tests. */
export const nodeServer = setupServer(...handlers);
