import { afterAll, afterEach, beforeAll } from "vitest";
import { nodeServer } from "../src/mocks/node";
import { resetAuthMockState } from "../src/mocks/handlers/auth";
import { resetAdminMockState } from "../src/mocks/handlers/admin";

beforeAll(() => nodeServer.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  nodeServer.resetHandlers();
  resetAuthMockState();
  resetAdminMockState();
});
afterAll(() => nodeServer.close());
