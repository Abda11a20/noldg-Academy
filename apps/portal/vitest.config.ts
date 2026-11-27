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
      "../../packages/config/vitest-console-guard.ts",
    ],
    passWithNoTests: true,
    coverage: {
      ...vitestPreset.coverage,
      thresholds: {
        statements: 85.18,
        branches: 66.73,
        functions: 73.96,
        lines: 87.44,
      },
    },
  },
});
