import { defineConfig } from "vitest/config";
import { vitestPreset } from "@noldg/config/vitest";

export default defineConfig({
  test: {
    ...vitestPreset,
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["**/referencebackend/**", "**/node_modules/**", "**/dist/**"],
    setupFiles: [
      "../../packages/api/test/setup.ts",
      "./test/setup.ts",
      "../../packages/api/test/console-guard.ts",
    ],
    passWithNoTests: true,
    coverage: {
      ...vitestPreset.coverage,
      thresholds: {
        statements: 87.3,
        branches: 71.61,
        functions: 77.16,
        lines: 89.4,
      },
    },
  },
});
