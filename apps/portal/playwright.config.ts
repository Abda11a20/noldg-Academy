import { defineConfig, devices } from "@playwright/test";
import { E2E_BASE_URL } from "./scripts/e2e-constants.mjs";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["**/referencebackend/**", "**/node_modules/**"],
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["json", { outputFile: "test-results/e2e-results.json" }]],
  use: {
    baseURL: process.env.PORTAL_E2E_BASE_URL ?? E2E_BASE_URL,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
});
