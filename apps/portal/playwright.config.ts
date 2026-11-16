import { defineConfig, devices } from "@playwright/test";

const PORTAL_TEST_PORT = 4174;

export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["**/referencebackend/**", "**/node_modules/**"],
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${PORTAL_TEST_PORT}`,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: `node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${PORTAL_TEST_PORT} --strictPort`,
    url: `http://127.0.0.1:${PORTAL_TEST_PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
