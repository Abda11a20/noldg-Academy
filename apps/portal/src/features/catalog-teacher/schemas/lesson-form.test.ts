import { describe, expect, it } from "vitest";
import { createLessonFormSchema, LESSON_FORM_DEFAULTS } from "./lesson-form";

const now = new Date("2024-03-01T00:00:00.000Z");
const validForm = {
  ...LESSON_FORM_DEFAULTS,
  title: "Lesson",
  availableFromLocal: "2024-03-01T03:00",
  availableUntilLocal: "2024-03-02T03:00",
};

describe("lesson form time and amount rules", () => {
  it("accepts an ordered Cairo window with a future end", () => {
    expect(createLessonFormSchema(now).safeParse(validForm).success).toBe(true);
  });

  it("rejects end times before the start or in the past", () => {
    const schema = createLessonFormSchema(now);
    expect(
      schema.safeParse({ ...validForm, availableUntilLocal: "2024-03-01T02:00" }).success,
    ).toBe(false);
    expect(
      schema.safeParse({ ...validForm, availableUntilLocal: "2024-02-29T02:00" }).success,
    ).toBe(false);
  });

  it("rejects ambiguous Cairo input and non-integer paid lesson prices", () => {
    const schema = createLessonFormSchema(now);
    expect(schema.safeParse({ ...validForm, availableFromLocal: "2024-10-31T23:30" }).success).toBe(
      false,
    );
    expect(schema.safeParse({ ...validForm, access: "paid", price: "12.5" }).success).toBe(false);
    expect(schema.safeParse({ ...validForm, access: "paid", price: "120" }).success).toBe(true);
  });
});
