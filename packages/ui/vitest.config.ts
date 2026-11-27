import { defineConfig } from "vitest/config";
import { vitestPreset } from "@noldg/config/vitest";

export default defineConfig({
  test: {
    ...vitestPreset,
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["**/referencebackend/**", "**/node_modules/**", "**/dist/**"],
    coverage: {
      ...vitestPreset.coverage,
      exclude: ["src/**/*.css", "src/assets/**"],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
    setupFiles: ["./test/setup.ts", "../config/vitest-console-guard.ts"],
  },
});
