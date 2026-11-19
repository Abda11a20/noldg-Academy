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
    },
    setupFiles: ["./test/setup.ts"],
  },
});
