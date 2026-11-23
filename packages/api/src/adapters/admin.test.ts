import { describe, expect, it } from "vitest";
import {
  adaptAcademicSubject,
  adaptAcademicTrack,
  adaptTeacherApplication,
  unwrapAdminData,
} from "./admin";

describe("administrative adapters", () => {
  it("accepts target mock tracks and subjects unchanged", () => {
    expect(
      adaptAcademicTrack({
        id: "a",
        system: "general",
        stage: "prep",
        grade: 1,
        name: "Track",
        active: true,
      }),
    ).toMatchObject({ system: "general", stage: "prep", active: true });
    expect(adaptAcademicSubject({ id: "s", name: "Math", active: true })).toMatchObject({
      id: "s",
      active: true,
    });
  });

  it("maps legacy system, stage, and active fields", () => {
    expect(
      adaptAcademicTrack(
        {
          id: "a",
          system: "al_azhar",
          stage: "preparatory",
          grade: 2,
          name: "Track",
          isActive: false,
        },
        "live",
      ),
    ).toMatchObject({ system: "azhar", stage: "prep", active: false });
    expect(
      adaptAcademicTrack(
        {
          id: "b",
          system: "egyptian_baccalaureate",
          stage: "secondary",
          grade: 1,
          name: "Track",
          isActive: true,
        },
        "live",
      ).system,
    ).toBe("egyptian_bacc");
    expect(adaptAcademicSubject({ id: "s", name: "Math", isActive: false }, "live").active).toBe(
      false,
    );
  });

  it("normalizes teacher profile detail and nested offerings", () => {
    const adapted = adaptTeacherApplication(
      {
        id: "application-id",
        userId: {
          id: "user-id",
          name: "Teacher",
          email: "teacher@example.test",
          phone: "+201000000000",
        },
        bio: "Profile",
        profileImage: { url: "https://example.test/image.png" },
        approvalStatus: "rejected",
        rejectionReason: "Add experience",
        createdAt: "2026-11-20T12:00:00.000Z",
        reviewedAt: "2026-11-21T12:00:00.000Z",
        offerings: [
          {
            trackId: {
              id: "track",
              system: "general",
              stage: "secondary",
              grade: 1,
              name: "Track",
              isActive: true,
            },
            subjectId: { id: "subject", name: "Math", isActive: true },
          },
        ],
      },
      "live",
    );
    expect(adapted).toMatchObject({
      status: "rejected",
      imageUrl: "https://example.test/image.png",
      rejectionReason: "Add experience",
      offerings: [
        {
          trackId: "track",
          subjectId: "subject",
          track: { stage: "secondary" },
          subject: { active: true },
        },
      ],
    });
  });

  it("unwraps the legacy response envelope and rejects invalid contracts", () => {
    expect(unwrapAdminData({ data: [{ id: 1 }] })).toEqual([{ id: 1 }]);
    expect(unwrapAdminData({ items: [] })).toEqual({ items: [] });
    expect(() =>
      adaptAcademicTrack({ id: "bad", system: "unknown", stage: "x", grade: 0, name: "" }, "live"),
    ).toThrow();
  });
});
