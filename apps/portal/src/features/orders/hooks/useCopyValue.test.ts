import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useCopyValue } from "./useCopyValue";

it("copies a value and marks only that value as copied", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  const { result } = renderHook(() => useCopyValue());
  await act(async () => result.current.copy("ORD-42"));
  expect(writeText).toHaveBeenCalledWith("ORD-42");
  expect(result.current.copiedValue).toBe("ORD-42");
});
