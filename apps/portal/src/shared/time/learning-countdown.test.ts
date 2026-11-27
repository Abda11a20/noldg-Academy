import { expect, it } from "vitest";
import { formatRemainingFromServer } from "./time";

it("formats a server-relative countdown and clamps elapsed values to zero", () => {
  expect(formatRemainingFromServer("2026-11-27T12:30:00.000Z", "2026-11-27T10:00:00.000Z")).toBe(
    "2:30",
  );
  expect(formatRemainingFromServer("2026-11-27T09:00:00.000Z", "2026-11-27T10:00:00.000Z")).toBe(
    "0:00",
  );
});
