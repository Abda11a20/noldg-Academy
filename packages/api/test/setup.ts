import { afterAll, afterEach, beforeAll } from "vitest";
import { nodeServer } from "../src/mocks/node";

beforeAll(() => nodeServer.listen({ onUnhandledRequest: "error" }));
afterEach(() => nodeServer.resetHandlers());
afterAll(() => nodeServer.close());
