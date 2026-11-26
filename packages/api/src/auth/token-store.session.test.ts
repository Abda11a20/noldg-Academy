import { beforeAll, describe, expect, it, vi } from "vitest";
import type * as TokenStoreModule from "./token-store";

let storeModule: typeof TokenStoreModule;

beforeAll(async () => {
  vi.stubEnv("VITE_AUTH_STORAGE", "session");
  storeModule = await import("./token-store");
});

describe("temporary session storage fallback", () => {
  it("falls back to memory storage when sessionStorage is unavailable and refreshes through its handler", async () => {
    const { tokenStore, setRefreshHandler } = storeModule;
    tokenStore.setSession({ accessToken: "session-fallback-token" });
    expect(tokenStore.getAccessToken()).toBe("session-fallback-token");
    setRefreshHandler(async () => "refreshed-token");
    await expect(tokenStore.refresh()).resolves.toBe("refreshed-token");
    tokenStore.clear();
    expect(tokenStore.getAccessToken()).toBeNull();
  });
});
