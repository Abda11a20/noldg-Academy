import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { vitestPreset } from "@noldg/config/vitest";

export default defineConfig({
  resolve: {
    alias: {
      "@testing-library/react": fileURLToPath(
        new URL("../../packages/ui/node_modules/@testing-library/react", import.meta.url),
      ),
      "@testing-library/user-event": fileURLToPath(
        new URL("../../packages/ui/node_modules/@testing-library/user-event", import.meta.url),
      ),
    },
  },
  test: {
    ...vitestPreset,
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["**/referencebackend/**", "**/node_modules/**", "**/dist/**"],
    setupFiles: ["../../packages/api/test/setup.ts", "./test/setup.ts"],
    passWithNoTests: true,
  },
});
