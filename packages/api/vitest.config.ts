import { defineConfig } from "vitest/config";
import { vitestPreset } from "@noldg/config/vitest";

export default defineConfig({
  test: {
    ...vitestPreset,
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["**/referencebackend/**", "**/node_modules/**", "**/dist/**"],
    setupFiles: ["./test/setup.ts", "./test/console-guard.ts"],
    coverage: {
      ...vitestPreset.coverage,
      thresholds: { statements: 93, branches: 83, functions: 98, lines: 95 },
    },
  },
});
