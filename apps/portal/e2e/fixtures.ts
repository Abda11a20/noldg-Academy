import { expect, test as base } from "@playwright/test";

/** Fails each browser test when the page emits a console error or uncaught exception. */
export const test = base.extend<{ browserErrors: void }>({
  browserErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      const handledApiErrors = new Map<number, number>();
      let handledApiNetworkFailures = 0;
      page.on("requestfailed", (request) => {
        const isApiRequest = new URL(request.url()).pathname.includes("/api/");
        if (
          isApiRequest &&
          (request.resourceType() === "fetch" || request.resourceType() === "xhr")
        ) {
          handledApiNetworkFailures += 1;
        }
      });
      page.on("response", (response) => {
        const request = response.request();
        const status = response.status();
        const isApiRequest = new URL(response.url()).pathname.includes("/api/");
        if (
          isApiRequest &&
          (request.resourceType() === "fetch" || request.resourceType() === "xhr") &&
          status >= 400 &&
          status < 500
        ) {
          handledApiErrors.set(status, (handledApiErrors.get(status) ?? 0) + 1);
        }
      });
      page.on("console", (message) => {
        if (message.type() !== "error") return;
        // Chromium reports handled API failures as console diagnostics as well as network events.
        if (message.text().includes("net::ERR_FAILED") && handledApiNetworkFailures > 0) {
          handledApiNetworkFailures -= 1;
          return;
        }
        const expectedApiStatus = message.text().match(/status of (\d{3})/);
        const status = expectedApiStatus ? Number(expectedApiStatus[1]) : undefined;
        const handledCount = status === undefined ? 0 : (handledApiErrors.get(status) ?? 0);
        if (status !== undefined && handledCount > 0) {
          handledApiErrors.set(status, handledCount - 1);
          return;
        }
        errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));
      await use();
      expect(errors, "Browser console and uncaught page errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
