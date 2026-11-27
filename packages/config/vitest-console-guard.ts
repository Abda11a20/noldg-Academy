import { afterEach, beforeEach, vi } from "vitest";

const describeCalls = (calls: unknown[][]) =>
  calls.map((call) => call.map((value) => String(value)).join(" ")).join("\n");

let warnSpy: ReturnType<typeof vi.spyOn> | undefined;
let errorSpy: ReturnType<typeof vi.spyOn> | undefined;

function collectConsoleViolations(): string {
  const warnings = warnSpy?.mock.calls ?? [];
  const errors = errorSpy?.mock.calls ?? [];
  warnSpy?.mockRestore();
  errorSpy?.mockRestore();
  warnSpy = undefined;
  errorSpy = undefined;

  return [
    warnings.length > 0 ? `Unexpected console.warn:\n${describeCalls(warnings)}` : "",
    errors.length > 0 ? `Unexpected console.error:\n${describeCalls(errors)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

beforeEach(() => {
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  const violation = collectConsoleViolations();
  if (violation) throw new Error(violation);
});
