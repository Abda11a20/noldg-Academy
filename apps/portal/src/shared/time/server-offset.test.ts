import { getDisplayRemainingSeconds } from "./server-offset";
import { describe, expect, it } from "vitest";

describe("getDisplayRemainingSeconds", () => {
  it("uses the server offset and injected clock for display only", () => {
    expect(
      getDisplayRemainingSeconds(
        "2026-11-28T10:00:00Z",
        "2026-11-28T09:00:00Z",
        Date.parse("2026-11-28T09:00:00Z"),
        new Date("2026-11-28T09:30:00Z"),
      ),
    ).toBe(1800);
  });

  it("returns zero for expired and invalid timestamps", () => {
    expect(
      getDisplayRemainingSeconds(
        "2026-01-01T00:00:00Z",
        "2026-01-01T00:00:01Z",
        Date.parse("2026-01-01T00:00:01Z"),
        new Date("2026-01-01T00:00:01Z"),
      ),
    ).toBe(0);
    expect(getDisplayRemainingSeconds("invalid", "invalid", Date.now(), new Date())).toBe(0);
  });
});
