import { defineConfig } from "vitest/config";
import { vitestPreset } from "@noldg/config/vitest";

export default defineConfig({
  test: {
    ...vitestPreset,
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["**/referencebackend/**", "**/node_modules/**", "**/dist/**"],
    setupFiles: ["../../packages/api/test/setup.ts", "./test/setup.ts"],
    passWithNoTests: true,
    coverage: {
      ...vitestPreset.coverage,
      thresholds: {
        statements: 82.13,
        branches: 63.95,
        functions: 70.58,
        lines: 84.65,
      },
    },
  },
});
