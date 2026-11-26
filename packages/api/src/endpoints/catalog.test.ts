import { describe, expect, it, vi } from "vitest";
import {
  createCourseLesson,
  createLessonProduct,
  getCourseLesson,
  getProductPricing,
  listCourseLessons,
  listTeacherCourses,
  listTeacherProducts,
  requestLessonUploadTicket,
  updateCourseLesson,
  updateCourseLessonStatus,
  updatePackageProduct,
} from "./catalog";

const state = { page: 1, pageSize: 10, search: "", filters: {} };

describe("teacher catalog endpoints", () => {
  it("lists target mock courses and lessons with URL-backed filter state", async () => {
    const courses = await listTeacherCourses(state);
    const lessons = await listCourseLessons("course-general-secondary-1", state);
    expect(courses.items).toHaveLength(1);
    expect(lessons.items[0]?.title).toBe("Introduction");
    expect(
      await listCourseLessons("course-general-secondary-1", {
        ...state,
        search: "missing",
      }),
    ).toMatchObject({ items: [], total: 0 });
  });

  it("searches lesson titles without consulting the host locale", async () => {
    const localeLowerCase = vi
      .spyOn(String.prototype, "toLocaleLowerCase")
      .mockImplementation(() => {
        throw new Error("Locale-dependent casing must not be used for search.");
      });
    try {
      await expect(
        listCourseLessons("course-general-secondary-1", { ...state, search: "INTRODUCTION" }),
      ).resolves.toMatchObject({ items: [{ title: "Introduction" }], total: 1 });
    } finally {
      localeLowerCase.mockRestore();
    }
  });

  it("creates and updates lessons and maps status changes", async () => {
    const created = await createCourseLesson("course-general-secondary-1", {
      title: "New lesson",
      description: "Lesson details",
      kind: "recorded",
      status: "draft",
      availableFrom: "2026-01-01T00:00:00.000Z",
      availableUntil: "2027-01-01T00:00:00.000Z",
      access: "free",
    });
    expect(created.status).toBe("draft");
    const updated = await updateCourseLesson(created.id, { title: "Updated lesson" });
    expect(updated.title).toBe("Updated lesson");
    expect((await updateCourseLessonStatus(created.id, "archived")).status).toBe("archived");
    expect((await getCourseLesson(created.courseId, created.id)).title).toBe("Updated lesson");
  });

  it("creates and lists package products and returns the server pricing preview", async () => {
    const created = await createLessonProduct({
      courseId: "course-general-secondary-1",
      name: "New package",
      price: 240,
      announcedLessonCount: 2,
      lessonIds: ["lesson-introduction"],
    });
    expect(created).toMatchObject({ product: { type: "package", name: "New package" } });
    const products = await listTeacherProducts();
    const product = products.find(({ product: item }) => item.name === "New package")?.product;
    expect(product).toBeDefined();
    expect(await getProductPricing(product?.id ?? "")).toMatchObject({
      pricing: { currentPrice: 240 },
    });
    expect(
      await updatePackageProduct(product?.id ?? "", { name: "Updated package" }),
    ).toBeDefined();
  });

  it("keeps lesson prices on lesson products and reads the server pricing preview", async () => {
    const lesson = await getCourseLesson(
      "course-general-secondary-1",
      "lesson-introduction",
      undefined,
      true,
    );
    expect(lesson).toMatchObject({ price: 150, currentStudentPrice: 150 });
    const created = await createCourseLesson("course-general-secondary-1", {
      title: "Paid lesson",
      description: "Lesson details",
      kind: "recorded",
      status: "draft",
      availableFrom: "2026-01-01T00:00:00.000Z",
      availableUntil: "2027-01-01T00:00:00.000Z",
      access: "free",
    });
    await updateCourseLesson(created.id, { access: "paid", price: 80 });
    const lessonProduct = (await listTeacherProducts()).find(
      ({ product }) => product.lessonId === created.id,
    );
    expect(lessonProduct?.product).toMatchObject({ price: 80, status: "active" });
    await updateCourseLesson(created.id, { access: "free" });
    expect(
      (await listTeacherProducts()).find(({ product }) => product.lessonId === created.id)?.product
        .status,
    ).toBe("archived");
  });

  it("returns the mock signed form-post upload ticket", async () => {
    await expect(
      requestLessonUploadTicket("course-general-secondary-1", {
        kind: "video",
        name: "lesson.mp4",
      }),
    ).resolves.toMatchObject({ method: "form-post", fields: { mockScenario: "success" } });
  });
});
