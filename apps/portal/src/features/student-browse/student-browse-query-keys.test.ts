import { describe, expect, it } from "vitest";
import { studentBrowseQueryKeys } from "./student-browse-query-keys";

describe("studentBrowseQueryKeys", () => {
  it("separates lists and details while retaining typed list filters", () => {
    const query = { page: 2, pageSize: 12, q: "mona", sort: "rating" as const };
    expect(studentBrowseQueryKeys.list(query)).toEqual(["student-browse", "list", query]);
    expect(studentBrowseQueryKeys.detail("teacher-1")).toEqual([
      "student-browse",
      "detail",
      "teacher-1",
    ]);
  });
});
