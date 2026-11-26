import { describe, expect, it } from "vitest";
import { TrackInputSchema, TeacherReviewSchema } from "./admin";
import { ListUrlStateSchema } from "./common";

describe("administrative contracts", () => {
  it("rejects American Diploma tracks outside secondary school", () => {
    expect(
      TrackInputSchema.safeParse({
        system: "american_diploma",
        stage: "prep",
        grade: 1,
        name: "Track",
      }).success,
    ).toBe(false);
    expect(
      TrackInputSchema.safeParse({
        system: "american_diploma",
        stage: "secondary",
        grade: 3,
        name: "Track",
      }).success,
    ).toBe(true);
  });

  it.each([0, 4, 1.5])("rejects a track outside the supported grade range (%s)", (grade) => {
    expect(
      TrackInputSchema.safeParse({
        system: "general",
        stage: "secondary",
        grade,
        name: "Track",
      }).success,
    ).toBe(false);
  });

  it("requires a minimum reason when a reviewer rejects an application", () => {
    expect(TeacherReviewSchema.safeParse({ status: "rejected", reason: "short" }).success).toBe(
      false,
    );
    expect(
      TeacherReviewSchema.safeParse({ status: "rejected", reason: "Needs more experience" })
        .success,
    ).toBe(true);
    expect(TeacherReviewSchema.safeParse({ status: "approved" }).success).toBe(true);
  });

  it("validates list state and rejects invalid page values", () => {
    expect(
      ListUrlStateSchema.safeParse({ page: 2, pageSize: 20, search: "math", filters: {} }).success,
    ).toBe(true);
    expect(
      ListUrlStateSchema.safeParse({ page: 0, pageSize: 20, search: "", filters: {} }).success,
    ).toBe(false);
  });
});
