import { describe, expect, it } from "vitest";
import {
  cairoLocalToIso,
  formatCairoDateTime,
  isAfterNow,
  isBeforeNow,
  isoToCairoLocal,
} from "./time";

describe("Cairo time conversion", () => {
  it("rejects a local time skipped by the daylight-saving jump", () => {
    expect(() => cairoLocalToIso("2024-04-26T00:30")).toThrow(/does not exist/);
  });

  it("requires a choice for a repeated local time and resolves both instants", () => {
    const earlier = cairoLocalToIso("2024-10-31T23:30", "earlier");
    const later = cairoLocalToIso("2024-10-31T23:30", "later");
    expect(() => cairoLocalToIso("2024-10-31T23:30")).toThrow(/ambiguous/);
    expect(new Date(later).getTime() - new Date(earlier).getTime()).toBe(60 * 60 * 1000);
  });

  it("preserves midnight boundaries and round-trips ordinary Cairo times", () => {
    const midnight = cairoLocalToIso("2024-03-01T00:00");
    expect(isoToCairoLocal(midnight)).toBe("2024-03-01T00:00");
    const timestamp = cairoLocalToIso("2024-06-15T13:45");
    expect(isoToCairoLocal(timestamp)).toBe("2024-06-15T13:45");
    expect(formatCairoDateTime(timestamp, "en-EG")).toContain("Jun");
  });

  it("compares instants against the injected clock", () => {
    const now = new Date("2024-03-01T00:00:00.000Z");
    expect(isBeforeNow("2024-02-29T23:59:59.000Z", now)).toBe(true);
    expect(isAfterNow("2024-03-01T00:00:01.000Z", now)).toBe(true);
  });
});
