import { expect, test as base } from "@playwright/test";

/** Fails on application console errors and uncaught exceptions, while allowing handled API failures. */
export const test = base.extend<{ browserErrors: void }>({
  browserErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      const apiFailureStatuses = new Set<number>();
      let apiNetworkFailure = false;
      page.on("response", (response) => {
        if (new URL(response.url()).pathname.startsWith("/api/") && !response.ok())
          apiFailureStatuses.add(response.status());
      });
      page.on("requestfailed", (request) => {
        if (new URL(request.url()).pathname.startsWith("/api/")) apiNetworkFailure = true;
      });
      page.on("console", (message) => {
        if (message.type() !== "error") return;
        const text = message.text();
        const status = text.match(/status of (\d{3})/u)?.[1];
        if (status && apiFailureStatuses.has(Number(status))) return;
        if (text.includes("net::ERR_FAILED") && apiNetworkFailure) return;
        errors.push(text);
      });
      page.on("pageerror", (error) => errors.push(error.message));
      await use();
      expect(errors, "Browser console and uncaught page errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
