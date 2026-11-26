import { describe, expect, it } from "vitest";
import {
  CatalogPriceSchema,
  ProductInputWithLessonLimitSchema,
  UploadTicketSchema,
} from "./catalog";

describe("catalog contracts", () => {
  it("accepts only positive whole-EGP catalog prices within the backend limit", () => {
    expect(CatalogPriceSchema.safeParse(1).success).toBe(true);
    expect(CatalogPriceSchema.safeParse(2_147_483_647).success).toBe(true);
    expect(CatalogPriceSchema.safeParse(0).success).toBe(false);
    expect(CatalogPriceSchema.safeParse(1.5).success).toBe(false);
  });

  it("rejects packages whose selected lesson count exceeds the announced count", () => {
    expect(
      ProductInputWithLessonLimitSchema.safeParse({
        courseId: "course-1",
        name: "Package",
        price: 100,
        announcedLessonCount: 1,
        lessonIds: ["lesson-1", "lesson-2"],
      }).success,
    ).toBe(false);
  });

  it("validates both form-post and reserved tus tickets", () => {
    expect(
      UploadTicketSchema.safeParse({
        method: "form-post",
        url: "https://uploads.example.test/form",
        fields: { signature: "signed" },
        uploadToken: "opaque",
      }).success,
    ).toBe(true);
    expect(
      UploadTicketSchema.safeParse({
        method: "tus",
        url: "https://uploads.example.test/tus",
        headers: { authorization: "signed" },
        uploadToken: "opaque",
      }).success,
    ).toBe(true);
  });
});
