import { expect, it } from "vitest";
import { MOCK_BROWSE_TEACHERS } from "../mocks/fixtures/browse";
import {
  BrowseTeacherDetailSchema,
  BrowseTeacherListSchema,
  BrowseTeacherQuerySchema,
  BrowseTeacherSchema,
} from "./browse";

it("validates bilingual teacher previews, server availability and server prices", () => {
  const teacher = MOCK_BROWSE_TEACHERS[0];
  expect(BrowseTeacherDetailSchema.parse(teacher).courses[0]?.lessons[0]?.availability).toBe(
    "upcoming",
  );
  expect(
    BrowseTeacherListSchema.parse({
      items: [{ ...teacher, bio: undefined, bioAr: undefined, courses: undefined }],
      page: 1,
      pageSize: 12,
      total: 1,
      serverNow: "2026-11-26T05:00:00.000Z",
    }).items,
  ).toHaveLength(1);
});

it("accepts only https teacher photo URLs, an empty value, or null", () => {
  const base = MOCK_BROWSE_TEACHERS[0]!;
  const withPhoto = (photoUrl: unknown) => ({ ...base, photoUrl });
  expect(BrowseTeacherSchema.safeParse(withPhoto("https://cdn.example.com/p.png")).success).toBe(
    true,
  );
  expect(BrowseTeacherSchema.safeParse(withPhoto("")).success).toBe(true);
  expect(BrowseTeacherSchema.safeParse(withPhoto(null)).success).toBe(true);
  for (const rejected of [
    "javascript:alert(1)",
    "http://cdn.example.com/p.png",
    "data:image/png;base64,AAAA",
    "//cdn.example.com/p.png",
    "not-a-url",
  ]) {
    expect(BrowseTeacherSchema.safeParse(withPhoto(rejected)).success).toBe(false);
  }
});

it("rejects unsupported availability and invalid paging values", () => {
  expect(
    BrowseTeacherQuerySchema.safeParse({ page: 0, pageSize: 12, q: "", sort: "newest" }).success,
  ).toBe(false);
  expect(
    BrowseTeacherDetailSchema.safeParse({
      ...MOCK_BROWSE_TEACHERS[0],
      courses: [
        {
          ...MOCK_BROWSE_TEACHERS[0]!.courses[0]!,
          lessons: [{ ...MOCK_BROWSE_TEACHERS[0]!.courses[0]!.lessons[0]!, availability: "maybe" }],
        },
      ],
    }).success,
  ).toBe(false);
});
