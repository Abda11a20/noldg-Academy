import { describe, expect, it } from "vitest";
import { adaptCourse, adaptLesson, adaptProduct, adaptUploadTicket } from "./catalog";

describe("catalog adapters", () => {
  it("accepts target mock records without rewriting them", () => {
    const targetCourse = {
      id: "course-1",
      subject: { id: "subject-1", name: "Math" },
      track: { id: "track-1", name: "Grade 1", system: "general", stage: "secondary", grade: 1 },
      lessonCount: 1,
      packageCount: 0,
      status: "active",
    };
    expect(adaptCourse(targetCourse)).toEqual(targetCourse);
  });

  it("maps the legacy nested course relation to the target contract", () => {
    expect(
      adaptCourse(
        {
          id: "course-1",
          trackId: {
            id: "track-1",
            name: "Grade 1",
            system: "al_azhar",
            stage: "preparatory",
            grade: 1,
            isActive: true,
          },
          subjectId: { id: "subject-1", name: "Math", isActive: true },
        },
        "live",
      ),
    ).toMatchObject({ track: { system: "azhar", stage: "prep" }, subject: { id: "subject-1" } });
  });

  it("normalizes live records when optional lesson and course metadata is absent", () => {
    expect(
      adaptCourse(
        {
          id: "course-minimal",
          trackId: {
            id: "track-1",
            name: "Grade 1",
            system: "general",
            stage: "secondary",
            grade: 1,
            isActive: true,
          },
          subjectId: { id: "subject-1", name: "Math", isActive: true },
        },
        "live",
      ),
    ).toMatchObject({ id: "course-minimal" });
    expect(
      adaptLesson(
        {
          id: "lesson-no-video",
          courseId: "course-1",
          title: "No video",
          description: "",
          type: "recorded",
          status: "draft",
          availableFrom: "2025-01-01T00:00:00.000Z",
          availableUntil: "2027-01-01T00:00:00.000Z",
          isFree: false,
        },
        "live",
      ),
    ).toMatchObject({ videoState: "none", attachments: [] });
  });

  it("maps legacy lesson access, type, and media metadata", () => {
    expect(
      adaptLesson(
        {
          id: "lesson-1",
          courseId: "course-1",
          title: "Lesson",
          description: "Description",
          type: "recorded",
          status: "published",
          availableFrom: "2025-01-01T00:00:00.000Z",
          availableUntil: "2027-01-01T00:00:00.000Z",
          isFree: true,
          video: { publicId: "protected-video" },
          attachments: [],
        },
        "live",
      ),
    ).toMatchObject({ kind: "recorded", access: "free", videoState: "ready" });
  });

  it("maps package activity but leaves unrepresented package membership absent", () => {
    expect(
      adaptProduct(
        {
          id: "product-1",
          courseId: { id: "course-1" },
          type: "package",
          name: "Package",
          price: 120,
          announcedLessonCount: 3,
          isActive: true,
        },
        "live",
      ),
    ).toMatchObject({ courseId: "course-1", status: "active" });
    expect(
      adaptProduct(
        {
          id: "product-2",
          courseId: "course-1",
          type: "package",
          name: "Archived package",
          price: 120,
          announcedLessonCount: 3,
          isActive: false,
        },
        "live",
      ).status,
    ).toBe("archived");
  });

  it("stringifies legacy provider fields and keeps mock tickets in the target shape", () => {
    expect(
      adaptUploadTicket(
        {
          success: true,
          data: {
            url: "https://uploads.example.test/form",
            fields: { timestamp: 123, overwrite: false },
            uploadToken: "opaque",
          },
        },
        "live",
      ),
    ).toMatchObject({ method: "form-post", fields: { timestamp: "123", overwrite: "false" } });
    expect(
      adaptUploadTicket({
        method: "form-post",
        url: "https://uploads.example.test/form",
        fields: { key: "value" },
        uploadToken: "opaque",
      }),
    ).toMatchObject({ method: "form-post" });
  });
});
