import { describe, expect, it } from "vitest";
import { createLessonFormSchema, LESSON_FORM_DEFAULTS } from "./catalog-editor";

const now = new Date("2026-01-01T00:00:00.000Z");
const values = {
  ...LESSON_FORM_DEFAULTS,
  title: "Lesson",
  availableFromLocal: "2026-01-01T12:00",
  availableUntilLocal: "2026-01-02T12:00",
};

function createSchema() {
  return createLessonFormSchema(now, {
    toIso(localTime) {
      if (localTime.startsWith("invalid")) throw new RangeError("Invalid time");
      return new Date(localTime + ":00Z").toISOString();
    },
    isAfterNow: (timestamp, clock) => new Date(timestamp).getTime() > clock.getTime(),
    isAfterTimestamp: (timestamp, other) =>
      new Date(timestamp).getTime() > new Date(other).getTime(),
  });
}

describe("lesson editor contract", () => {
  it("accepts ordered future times and an integer paid price", () => {
    expect(createSchema().safeParse({ ...values, access: "paid", price: "120" }).success).toBe(
      true,
    );
  });

  it("reports a malformed Cairo time for each endpoint", () => {
    const result = createSchema().safeParse({
      ...values,
      availableFromLocal: "invalid-start",
      availableUntilLocal: "invalid-end",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map(({ path }) => path[0])).toContain("availableFromLocal");
      expect(result.error.issues.map(({ path }) => path[0])).toContain("availableUntilLocal");
    }
  });

  it("rejects invalid schedule order and past endings", () => {
    const schema = createSchema();
    expect(
      schema.safeParse({
        ...values,
        availableFromLocal: "2026-01-02T13:00",
        availableUntilLocal: "2026-01-02T12:00",
      }).success,
    ).toBe(false);
    expect(schema.safeParse({ ...values, availableUntilLocal: "2025-12-31T12:00" }).success).toBe(
      false,
    );
  });

  it("requires integer paid prices within the catalog bounds", () => {
    const schema = createSchema();
    expect(schema.safeParse({ ...values, access: "paid", price: "0" }).success).toBe(false);
    expect(schema.safeParse({ ...values, access: "paid", price: "12.5" }).success).toBe(false);
    expect(schema.safeParse({ ...values, access: "free", price: "12.5" }).success).toBe(true);
  });
});
