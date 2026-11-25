import { afterAll, afterEach, beforeAll } from "vitest";
import { nodeServer } from "../src/mocks/node";
import { resetAuthMockState } from "../src/mocks/handlers/auth";
import { resetAdminMockState } from "../src/mocks/handlers/admin";
import { resetCatalogMockState } from "../src/mocks/handlers/catalog";

beforeAll(() => nodeServer.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  nodeServer.resetHandlers();
  resetAuthMockState();
  resetAdminMockState();
  resetCatalogMockState();
});
afterAll(() => nodeServer.close());
