import { expect, it } from "vitest";
import { listBrowseTeachers, getBrowseTeacher } from "./browse";

it("serves browse list pages from the mock handler using track and subject filters", async () => {
  const result = await listBrowseTeachers({
    page: 1,
    pageSize: 4,
    q: "",
    trackId: "track-secondary-1",
    subjectId: "subject-math",
    minRating: 3,
    hasFreeLessons: true,
    sort: "rating",
  });
  expect(result.items.length).toBeGreaterThan(0);
  expect(result.items.every((teacher) => teacher.hasFreeLessons)).toBe(true);
  expect(result.serverNow).toBe("2026-11-26T05:00:00.000Z");
});

it("loads a target teacher detail and normalizes a missing teacher response", async () => {
  const teacher = await getBrowseTeacher("browse-teacher-1");
  expect(teacher.courses[0]?.products[0]?.pricing.priceNow).toBeGreaterThan(0);
  await expect(getBrowseTeacher("missing-teacher")).rejects.toMatchObject({ status: 404 });
});

it("rejects an empty detail identifier before sending a request", async () => {
  await expect(getBrowseTeacher(" ")).rejects.toMatchObject({ status: 400 });
});

it("supports an unfiltered list request and search with each server sort", async () => {
  const unfiltered = await listBrowseTeachers();
  expect(unfiltered.items.length).toBeGreaterThan(0);
  const missing = await listBrowseTeachers({ q: "no matching teacher", sort: "newest" });
  expect(missing.items).toEqual([]);
  const ascending = await listBrowseTeachers({ q: "", sort: "priceAsc" });
  const descending = await listBrowseTeachers({ q: "", sort: "priceDesc" });
  expect(ascending.items.length).toBeGreaterThan(0);
  expect(descending.items.length).toBeGreaterThan(0);
});
