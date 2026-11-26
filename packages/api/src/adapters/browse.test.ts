import { expect, it } from "vitest";
import { AppError } from "../errors/app-error";
import { MOCK_BROWSE_TEACHERS } from "../mocks/fixtures/browse";
import { adaptBrowseTeacher, adaptBrowseTeacherDetail, adaptBrowseTeacherList } from "./browse";

it("preserves target mock fields and normalizes mock list envelopes", () => {
  const fixture = MOCK_BROWSE_TEACHERS[0]!;
  expect(adaptBrowseTeacher(fixture, "mock").nameAr).toBe(fixture.nameAr);
  const list = adaptBrowseTeacherList(
    {
      items: [fixture],
      page: 2,
      pageSize: 12,
      total: 13,
      serverNow: "2026-11-26T05:00:00.000Z",
    },
    "mock",
  );
  expect(list).toMatchObject({ page: 2, total: 13 });
});

it("normalizes legacy teacher list and profile fields without unsupported summaries", () => {
  const legacy = {
    userId: { id: "teacher-legacy", name: "Teacher Legacy" },
    profileImage: { url: "https://cdn.example.invalid/photo.png" },
    bio: "A teacher bio",
    createdAt: "2025-01-01T00:00:00.000Z",
    offerings: [{ subjectId: { id: "subject-math", name: "Math" } }],
  };
  const list = adaptBrowseTeacherList(
    { data: [legacy], pagination: { page: 2, limit: 5, total: 6 } },
    "live",
    1,
    12,
  );
  expect(list).toMatchObject({
    page: 2,
    pageSize: 5,
    total: 6,
    items: [{ ratingAverage: null, startingPrice: null }],
  });
  const detail = adaptBrowseTeacherDetail({ data: legacy }, "live");
  expect(detail.courses).toEqual([]);
  expect(detail.subjects).toEqual([{ id: "subject-math", name: "Math" }]);
});

it("normalizes malformed mock and live payloads into AppError", () => {
  expect(() => adaptBrowseTeacher({}, "mock")).toThrow(AppError);
  expect(() => adaptBrowseTeacherList({ data: "bad" }, "live")).toThrow(AppError);
  expect(() => adaptBrowseTeacherList(null, "live")).toThrow(AppError);
  expect(() => adaptBrowseTeacherList({ data: [null] }, "live")).toThrow(AppError);
  expect(() => adaptBrowseTeacherDetail(null, "live")).toThrow(AppError);
});

it("normalizes legacy profiles without optional photo, bio, offerings, or pagination", () => {
  const teacher = {
    userId: { id: "teacher-minimal", name: "Minimal teacher" },
    createdAt: "2025-01-01T00:00:00.000Z",
  };
  expect(adaptBrowseTeacher(teacher, "live")).toMatchObject({
    id: "teacher-minimal",
    photoUrl: null,
    bioExcerpt: "",
    subjects: [],
    ratingAverage: null,
  });
  expect(adaptBrowseTeacherList({ data: [teacher] }, "live")).toMatchObject({
    page: 1,
    pageSize: 12,
    total: 1,
    items: [{ id: "teacher-minimal" }],
  });
  expect(adaptBrowseTeacherDetail(teacher, "live").courses).toEqual([]);
  expect(() => adaptBrowseTeacher({ userId: teacher.userId }, "live")).toThrow(AppError);
});
