import assert from "node:assert/strict";
import test from "node:test";
import { createHeaders } from "./generate-headers.mjs";

test("uses configured API and upload origins in the CSP connect-src and media-src directives", () => {
  const headers = createHeaders(
    "https://api.example.test",
    "https://uploads.example.test,https://media.example.test",
  );
  assert.match(
    headers,
    /connect-src 'self' https:\/\/api\.example\.test https:\/\/uploads\.example\.test https:\/\/media\.example\.test;/,
  );
  assert.match(
    headers,
    /media-src 'self' https:\/\/uploads\.example\.test https:\/\/media\.example\.test;/,
  );
  assert.doesNotMatch(headers, /res\.cloudinary\.com/u);
});

test("rejects a missing production API origin", () => {
  assert.throws(
    () => createHeaders(undefined, "https://uploads.example.test"),
    /VITE_API_ORIGIN is required/,
  );
});

test("rejects API URLs with a path", () => {
  assert.throws(
    () => createHeaders("https://api.example.test/v1", "https://uploads.example.test"),
    /origin without a path/,
  );
});

test("requires valid HTTPS upload origins", () => {
  assert.throws(
    () => createHeaders("https://api.example.test", undefined),
    /VITE_UPLOAD_ORIGINS is required/,
  );
  assert.throws(
    () => createHeaders("https://api.example.test", "https://uploads.example.test/path"),
    /HTTPS origins without paths/,
  );
  assert.throws(
    () => createHeaders("https://api.example.test", "http://uploads.example.test"),
    /HTTPS origins without paths/,
  );
});
