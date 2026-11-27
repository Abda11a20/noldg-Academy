import { expect, test as base } from "@playwright/test";

type FailureStatus = number | "network";

interface ExpectedApiFailure {
  method: string;
  urlPattern: RegExp;
  status: FailureStatus;
  failure?: string;
  required?: boolean;
}

interface ObservedApiFailure {
  method: string;
  url: string;
  status: FailureStatus;
  failure?: string;
}

function matchesExpectedFailure(
  observed: ObservedApiFailure,
  expected: ExpectedApiFailure,
): boolean {
  return (
    observed.method === expected.method.toUpperCase() &&
    expected.urlPattern.test(observed.url) &&
    observed.status === expected.status &&
    (!expected.failure || observed.failure === expected.failure)
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
      const resourceConsoleErrors: Array<{ url: string; message: string }> = [];

      page.on("response", (response) => {
        if (response.ok()) return;
        observed.push({
          method: response.request().method(),
          url: response.url(),
          status: response.status(),
        });
      });
      page.on("requestfailed", (request) => {
        observed.push({
          method: request.method(),
          url: request.url(),
          status: "network",
          failure: request.failure()?.errorText ?? "Unknown network failure",
        });
      });
      page.on("console", (message) => {
        if (message.type() !== "error") return;
        if (isBrowserResourceFailure(message.text())) {
          resourceConsoleErrors.push({ url: message.location().url, message: message.text() });
          return;
        }
        errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));

      await use((failure) => expected.push(failure));

      const declared = (failure: ObservedApiFailure) =>
        expected.some((declaration) => matchesExpectedFailure(failure, declaration));
      const unexpected = observed.filter((failure) => !declared(failure));
      const missingExpected = expected
        .filter((declaration) => declaration.required !== false)
        .filter(
          (declaration) =>
            !observed.some((failure) => matchesExpectedFailure(failure, declaration)),
        );
      const unpairedResourceConsoleErrors = resourceConsoleErrors.filter(
        (consoleError) =>
          !observed.some((failure) => failure.url === consoleError.url && declared(failure)),
      );
      expect(
        {
          consoleErrors: errors,
          undeclaredRequests: unexpected,
          missingExpectedRequests: missingExpected,
          unpairedResourceConsoleErrors,
        },
        "Only exact method, URL, and status failures declared by this scenario are tolerated",
      ).toEqual({
        consoleErrors: [],
        undeclaredRequests: [],
        missingExpectedRequests: [],
        unpairedResourceConsoleErrors: [],
      });
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
