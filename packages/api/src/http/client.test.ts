import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse, delay } from "msw";
import { API_BASE_URL } from "../constants/http";
import { tokenStore } from "../auth/token-store";
import { AppError } from "../errors/app-error";
import { nodeServer } from "../mocks/node";
import { request } from "./client";
import { z } from "zod";

const apiOrigin = API_BASE_URL;
const resultSchema = z.object({ ok: z.boolean() });

afterEach(() => tokenStore.clear());

describe("request", () => {
  it("returns validated JSON responses", async () => {
    nodeServer.use(http.get(`${apiOrigin}/sample`, () => HttpResponse.json({ ok: true })));
    await expect(request("/sample", resultSchema)).resolves.toEqual({ ok: true });
  });

  it("rejects a response that does not match its Zod schema", async () => {
    nodeServer.use(http.get(`${apiOrigin}/sample`, () => HttpResponse.json({ ok: "yes" })));
    await expect(request("/sample", resultSchema)).rejects.toMatchObject({
      code: "RESPONSE_VALIDATION_FAILED",
      status: 502,
    });
  });

  it("normalizes a network failure", async () => {
    nodeServer.use(http.get(`${apiOrigin}/sample`, () => Response.error()));
    await expect(request("/sample", resultSchema)).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      status: 0,
    });
  });

  it("normalizes a timeout", async () => {
    nodeServer.use(
      http.get(`${apiOrigin}/sample`, async () => {
        await delay(100);
        return HttpResponse.json({ ok: true });
      }),
    );
    await expect(request("/sample", resultSchema, { timeoutMs: 10 })).rejects.toMatchObject({
      code: "TIMEOUT",
      status: 408,
    });
  });

  it("refreshes once and retries a 401 request", async () => {
    const refresh = vi.fn();
    tokenStore.setSession({ accessToken: "old-access" });
    nodeServer.use(
      http.post(`${apiOrigin}/auth/refresh`, () => {
        refresh();
        return HttpResponse.json({ accessToken: "new-access" });
      }),
      http.get(`${apiOrigin}/sample`, ({ request: incoming }) =>
        incoming.headers.get("token") === "new-access" ||
        incoming.headers.get("authorization") === "Bearer new-access"
          ? HttpResponse.json({ ok: true })
          : HttpResponse.json({ message: "unauthorized" }, { status: 401 }),
      ),
    );
    await expect(request("/sample", resultSchema)).resolves.toEqual({ ok: true });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(tokenStore.getAccessToken()).toBe("new-access");
  });

  it("shares one refresh flight across concurrent 401 responses", async () => {
    const refresh = vi.fn();
    tokenStore.setSession({ accessToken: "old-access" });
    nodeServer.use(
      http.post(`${apiOrigin}/auth/refresh`, async () => {
        refresh();
        await delay(20);
        return HttpResponse.json({ accessToken: "new-access" });
      }),
      http.get(`${apiOrigin}/sample`, ({ request: incoming }) =>
        incoming.headers.get("token") === "new-access" ||
        incoming.headers.get("authorization") === "Bearer new-access"
          ? HttpResponse.json({ ok: true })
          : HttpResponse.json({ message: "unauthorized" }, { status: 401 }),
      ),
    );

    await expect(
      Promise.all([request("/sample", resultSchema), request("/sample", resultSchema)]),
    ).resolves.toEqual([{ ok: true }, { ok: true }]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("signals logout and clears auth after refresh fails", async () => {
    tokenStore.setSession({ accessToken: "expired-access" });
    nodeServer.use(
      http.post(`${apiOrigin}/auth/refresh`, () => HttpResponse.json({}, { status: 401 })),
      http.get(`${apiOrigin}/sample`, () => HttpResponse.json({}, { status: 401 })),
    );
    await expect(request("/sample", resultSchema)).rejects.toBeInstanceOf(AppError);
    expect(tokenStore.getAccessToken()).toBeNull();
  });

  it("normalizes an explicit abort", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      request("/sample", resultSchema, { signal: controller.signal }),
    ).rejects.toMatchObject({ code: "ABORTED", status: 0 });
  });
});
