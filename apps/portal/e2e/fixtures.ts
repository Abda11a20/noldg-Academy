import { expect, test as base } from "@playwright/test";

type FailureStatus = number | "network";

interface ExpectedApiFailure {
  method: string;
  urlPattern: RegExp;
  status: FailureStatus;
}

interface ObservedApiFailure {
  method: string;
  url: string;
  status: FailureStatus;
}

function matchesExpectedFailure(
  observed: ObservedApiFailure,
  expected: ExpectedApiFailure,
): boolean {
  return (
    observed.method === expected.method.toUpperCase() &&
    expected.urlPattern.test(observed.url) &&
    observed.status === expected.status
  );
}

function isBrowserResourceFailure(message: string): boolean {
  return message.startsWith("Failed to load resource");
}

/** Declares one expected failed request for the current scenario by method, URL, and status. */
export const test = base.extend<{
  declareExpectedApiFailure: (failure: ExpectedApiFailure) => void;
}>({
  declareExpectedApiFailure: [
    async ({ page }, use) => {
      const expected: ExpectedApiFailure[] = [];
      const observed: ObservedApiFailure[] = [];
      const errors: string[] = [];
      let resourceConsoleErrors = 0;

      page.on("response", (response) => {
        if (response.ok()) return;
        observed.push({
          method: response.request().method(),
          url: response.url(),
          status: response.status(),
        });
      });
      page.on("requestfailed", (request) => {
        observed.push({ method: request.method(), url: request.url(), status: "network" });
      });
      page.on("console", (message) => {
        if (message.type() !== "error") return;
        if (isBrowserResourceFailure(message.text())) {
          resourceConsoleErrors += 1;
          return;
        }
        errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));

      await use((failure) => expected.push(failure));

      const declared = (failure: ObservedApiFailure) =>
        expected.some((declaration) => matchesExpectedFailure(failure, declaration));
      const unexpected = observed.filter((failure) => !declared(failure));
      const matchedObservedCount = observed.filter(declared).length;
      expect(
        {
          consoleErrors: errors,
          undeclaredRequests: unexpected,
          unpairedResourceConsoleErrors: Math.max(0, resourceConsoleErrors - matchedObservedCount),
        },
        "Only scenario-declared request failures may produce browser resource errors",
      ).toEqual({
        consoleErrors: [],
        undeclaredRequests: [],
        unpairedResourceConsoleErrors: 0,
      });
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
