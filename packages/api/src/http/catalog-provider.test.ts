import { describe, expect, it } from "vitest";

function uploadBody(scenario: string): FormData {
  const body = new FormData();
  body.set("mockScenario", scenario);
  return body;
}

describe("catalog provider mock", () => {
  it("answers provider preflight requests with requested origins and headers", async () => {
    const preflight = await fetch("https://api.cloudinary.com/mock-upload", {
      method: "OPTIONS",
      headers: {
        origin: "http://localhost:5173",
        "access-control-request-headers": "content-type",
      },
    });
    const fallbackPreflight = await fetch("https://api.cloudinary.com/mock-upload", {
      method: "OPTIONS",
    });
    expect(preflight.headers.get("access-control-allow-origin")).toBe("http://localhost:5173");
    expect(preflight.headers.get("access-control-allow-headers")).toBe("content-type");
    expect(fallbackPreflight.headers.get("access-control-allow-origin")).toBe("*");
    expect(fallbackPreflight.headers.get("access-control-allow-headers")).toBe("*");
  });

  it("returns success for ordinary and slow direct uploads", async () => {
    const success = await fetch("https://api.cloudinary.com/mock-upload", {
      method: "POST",
      body: uploadBody("success"),
    });
    const slow = await fetch("https://api.cloudinary.com/mock-upload", {
      method: "POST",
      body: uploadBody("slow"),
    });
    expect(success.ok).toBe(true);
    expect(slow.ok).toBe(true);
  });

  it("returns provider rejection and expiry statuses", async () => {
    const rejected = await fetch("https://api.cloudinary.com/mock-upload", {
      method: "POST",
      body: uploadBody("failure"),
    });
    const expired = await fetch("https://api.cloudinary.com/mock-upload", {
      method: "POST",
      body: uploadBody("expired"),
    });
    expect(rejected.status).toBe(400);
    expect(expired.status).toBe(410);
  });

  it("fails the network for the network failure scenario", async () => {
    await expect(
      fetch("https://api.cloudinary.com/mock-upload", {
        method: "POST",
        body: uploadBody("network"),
      }),
    ).rejects.toThrow();
  });
});
