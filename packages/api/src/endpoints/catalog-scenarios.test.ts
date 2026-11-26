import { describe, expect, it } from "vitest";
import {
  createCourseLesson,
  getCourseLesson,
  getProductPricing,
  listCourseLessons,
  listTeacherProducts,
  requestLessonUploadTicket,
  updateCourseLesson,
  updateCourseLessonStatus,
  updatePackageProduct,
} from "./catalog";
import { AppError } from "../errors/app-error";

const state = { page: 1, pageSize: 10, search: "", filters: {} };

describe("catalog mock scenarios", () => {
  it("applies status, access, availability, and search filters", async () => {
    const available = await listCourseLessons("course-general-secondary-1", {
      ...state,
      filters: { status: "published", access: "paid", availability: "available" },
    });
    const unavailable = await listCourseLessons("course-general-secondary-1", {
      ...state,
      filters: { status: "draft", access: "free", availability: "unavailable" },
      search: "missing",
    });
    expect(available.items.map(({ id }) => id)).toContain("lesson-introduction");
    expect(unavailable.items).toEqual([]);
  });

  it("creates a published paid lesson with a video token and product", async () => {
    const lesson = await createCourseLesson("course-general-secondary-1", {
      title: "Paid video",
      description: "Recorded content",
      kind: "recorded",
      status: "published",
      availableFrom: "2026-01-01T00:00:00.000Z",
      availableUntil: "2027-01-01T00:00:00.000Z",
      access: "paid",
      price: 80,
      videoUploadToken: "video-token",
    });
    expect(lesson).toMatchObject({ status: "published", videoState: "processing" });
    expect(
      (await listTeacherProducts()).some(({ product }) => product.lessonId === lesson.id),
    ).toBe(true);
  });

  it("updates lesson media and rejects missing lesson or product ids", async () => {
    const updated = await updateCourseLesson("lesson-introduction", {
      videoUploadToken: "replacement-token",
      attachmentUploadTokens: ["attachment-token"],
    });
    expect(updated).toMatchObject({
      videoState: "processing",
      attachments: [{ publicId: "attachment-token" }],
    });
    await expect(updateCourseLesson("missing-lesson", { title: "Updated" })).rejects.toMatchObject({
      status: 404,
    });
    await expect(updateCourseLessonStatus("missing-lesson", "archived")).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      getCourseLesson("course-general-secondary-1", "missing-lesson"),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      updatePackageProduct("missing-product", { name: "Missing" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("rejects package overflow and returns unavailable pricing for archived products", async () => {
    await expect(
      updatePackageProduct("product-introduction", {
        announcedLessonCount: 1,
        lessonIds: ["lesson-introduction", "lesson-second"],
      }),
    ).rejects.toBeInstanceOf(AppError);
    await updatePackageProduct("product-introduction", { status: "archived" });
    await expect(
      getCourseLesson("course-general-secondary-1", "lesson-introduction", undefined, true),
    ).resolves.toMatchObject({ currentStudentPrice: 150 });
    await expect(getProductPricing("product-introduction")).rejects.toMatchObject({ status: 409 });
    await expect(getProductPricing("missing-product")).rejects.toMatchObject({ status: 404 });
  });

  it("selects mock upload ticket scenarios", async () => {
    await expect(
      requestLessonUploadTicket("course-general-secondary-1", {
        kind: "video",
        name: "failure.mp4",
      }),
    ).resolves.toMatchObject({ fields: { mockScenario: "failure" } });
    await expect(
      requestLessonUploadTicket("course-general-secondary-1", {
        kind: "video",
        name: "network-failure.mp4",
      }),
    ).resolves.toMatchObject({ fields: { mockScenario: "network" } });
    await expect(
      requestLessonUploadTicket("course-general-secondary-1", { kind: "video", name: "slow.mp4" }),
    ).resolves.toMatchObject({ fields: { mockScenario: "slow" } });
    await expect(
      requestLessonUploadTicket("course-general-secondary-1", {
        kind: "video",
        name: "expired.mp4",
      }),
    ).resolves.toMatchObject({ fields: { mockScenario: "expired" } });
  });

  it("settles processing videos as ready or failed", async () => {
    const ready = await createCourseLesson("course-general-secondary-1", {
      title: "Ready video",
      description: "Ready processing",
      kind: "recorded",
      status: "published",
      availableFrom: "2026-01-01T00:00:00.000Z",
      availableUntil: "2027-01-01T00:00:00.000Z",
      access: "free",
      videoUploadToken: "ready-token",
    });
    await listCourseLessons(ready.courseId, state);
    const readyResult = await listCourseLessons(ready.courseId, state);
    expect(readyResult.items.find(({ id }) => id === ready.id)?.videoState).toBe("ready");

    const failed = await createCourseLesson("course-general-secondary-1", {
      title: "Failed video",
      description: "Failed processing",
      kind: "recorded",
      status: "published",
      availableFrom: "2026-01-01T00:00:00.000Z",
      availableUntil: "2027-01-01T00:00:00.000Z",
      access: "free",
      videoUploadToken: "mock-video-processing-failed",
    });
    await listCourseLessons(failed.courseId, state);
    const failedResult = await listCourseLessons(failed.courseId, state);
    expect(failedResult.items.find(({ id }) => id === failed.id)?.videoState).toBe("failed");
  });
});
