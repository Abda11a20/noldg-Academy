import { afterAll, afterEach, beforeAll } from "vitest";
import { nodeServer } from "../src/mocks/node";
import { resetAuthMockState } from "../src/mocks/handlers/auth";

beforeAll(() => nodeServer.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  nodeServer.resetHandlers();
  resetAuthMockState();
});
afterAll(() => nodeServer.close());
