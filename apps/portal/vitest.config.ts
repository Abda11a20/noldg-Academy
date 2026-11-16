import { defineConfig } from "vitest/config";
import { vitestPreset } from "@noldg/config/vitest";

export default defineConfig({
  test: {
    ...vitestPreset,
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["**/referencebackend/**", "**/node_modules/**", "**/dist/**"],
    passWithNoTests: true,
  },
});
