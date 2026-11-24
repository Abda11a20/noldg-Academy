import assert from "node:assert/strict";
import test from "node:test";
import { createHeaders } from "./generate-headers.mjs";

test("uses the configured API origin in the CSP connect-src directive", () => {
  assert.match(
    createHeaders("https://api.example.test"),
    /connect-src 'self' https:\/\/api\.example\.test;/,
  );
});

test("rejects a missing production API origin", () => {
  assert.throws(() => createHeaders(undefined), /VITE_API_ORIGIN is required/);
});

test("rejects API URLs with a path", () => {
  assert.throws(() => createHeaders("https://api.example.test/v1"), /origin without a path/);
});
