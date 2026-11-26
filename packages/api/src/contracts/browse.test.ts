import { expect, it } from "vitest";
import { MOCK_BROWSE_TEACHERS } from "../mocks/fixtures/browse";
import {
  BrowseTeacherDetailSchema,
  BrowseTeacherListSchema,
  BrowseTeacherQuerySchema,
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
