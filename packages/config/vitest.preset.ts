/** Shared Vitest behavior for deterministic tests with V8 coverage. */
export const vitestPreset = {
  clearMocks: true,
  restoreMocks: true,
  coverage: { provider: "v8" as const, reporter: ["text", "lcov"] },
};
