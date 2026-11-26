import { expect, it } from "vitest";
import { createConfirmationKey } from "./useOrders";

it("creates distinct UUID keys for independent confirmation attempts", () => {
  const first = createConfirmationKey();
  const second = createConfirmationKey();
  expect(first).toMatch(/^[\da-f-]{36}$/i);
  expect(second).not.toBe(first);
});
