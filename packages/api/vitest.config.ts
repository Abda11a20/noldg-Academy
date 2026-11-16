import { defineConfig } from "vitest/config";
import { vitestPreset } from "@noldg/config/vitest";

export default defineConfig({
  test: {
    ...vitestPreset,
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["**/referencebackend/**", "**/node_modules/**", "**/dist/**"],
    setupFiles: ["./test/setup.ts"],
  },
});
