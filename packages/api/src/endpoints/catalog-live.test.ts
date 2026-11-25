import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { API_BASE_URL } from "../constants/http";
import { nodeServer } from "../mocks/node";

const legacyTrack = {
  id: "track-live",
  name: "Grade 1",
  system: "general",
  stage: "secondary",
  grade: 1,
  isActive: true,
};
const legacySubject = { id: "subject-live", name: "Math", isActive: true };
const legacyLesson = {
  id: "lesson-live",
  courseId: "course-live",
  title: "Live lesson",
  description: "Lesson details",
  type: "recorded",
  status: "published",
  availableFrom: "2026-01-01T00:00:00.000Z",
  availableUntil: "2027-01-01T00:00:00.000Z",
  isFree: false,
  video: null,
  attachments: [],
};
const pricing = {
  fullPrice: 100,
  currentPrice: 80,
  announcedLessonCount: 1,
  remainingLessonCount: 1,
  commissionPercentage: 20,
  platformAmount: 20,
  teacherAmount: 80,
  isPurchasable: true,
};

describe("catalog endpoints in legacy live mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("normalizes legacy lists, lesson CRUD, products, and server pricing", async () => {
    vi.stubEnv("VITE_API_MODE", "live");
    vi.stubEnv("VITE_CATALOG_CAP_LESSON_DRAFTS", "true");
    vi.stubEnv("VITE_CATALOG_CAP_LIVE_LESSONS", "true");
    vi.stubEnv("VITE_CATALOG_CAP_BUNDLE_LESSONS", "true");
    vi.resetModules();

    let lessonBody: Record<string, unknown> | undefined;
    let productBody: Record<string, unknown> | undefined;
    let lessonPatchBody: Record<string, unknown> | undefined;
    let productPatchBody: Record<string, unknown> | undefined;
    const legacyProduct = {
      id: "product-live",
      courseId: "course-live",
      type: "lesson",
      name: "Live lesson",
      price: 100,
      lessonId: "lesson-live",
      announcedLessonCount: 1,
      isActive: true,
    };

    nodeServer.use(
      http.get(`${API_BASE_URL}/courses/my`, () =>
        HttpResponse.json({
          data: [
            {
              id: "course-live",
              trackId: legacyTrack,
              subjectId: legacySubject,
              lessonCount: 1,
              packageCount: 0,
              status: "active",
            },
          ],
          pagination: { page: 1, limit: 10, total: 1 },
        }),
      ),
      http.get(`${API_BASE_URL}/lessons/courses/:courseId`, () =>
        HttpResponse.json({ data: [legacyLesson] }),
      ),
      http.post(`${API_BASE_URL}/lessons/courses/:courseId`, async ({ request }) => {
        lessonBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          { data: { ...legacyLesson, id: "lesson-created", ...lessonBody } },
          { status: 201 },
        );
      }),
      http.patch(`${API_BASE_URL}/lessons/:lessonId`, async ({ request }) => {
        lessonPatchBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: { ...legacyLesson, ...lessonPatchBody } });
      }),
      http.patch(`${API_BASE_URL}/lessons/:lessonId/status`, () =>
        HttpResponse.json({ data: legacyLesson }),
      ),
      http.get(`${API_BASE_URL}/products/my`, () =>
        HttpResponse.json({ data: [{ product: legacyProduct, pricing }] }),
      ),
      http.post(`${API_BASE_URL}/products`, async ({ request }) => {
        productBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: { product: legacyProduct, pricing } }, { status: 201 });
      }),
      http.patch(`${API_BASE_URL}/products/:productId`, async ({ request }) => {
        productPatchBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: { product: legacyProduct, pricing } });
      }),
      http.get(`${API_BASE_URL}/products/:productId/pricing`, () =>
        HttpResponse.json({ data: { product: legacyProduct, pricing } }),
      ),
    );

    const catalog = await import("./catalog");
    const state = { page: 1, pageSize: 10, search: "", filters: {} };
    expect(await catalog.listTeacherCourses(state)).toMatchObject({
      items: [{ id: "course-live" }],
      total: 1,
    });
    expect(await catalog.listCourseLessons("course-live", state)).toMatchObject({
      items: [{ id: "lesson-live", access: "paid" }],
    });
    expect(await catalog.listTeacherProducts()).toHaveLength(1);
    expect(await catalog.getProductPricing("product-live")).toMatchObject({
      pricing: { currentPrice: 80 },
    });
    expect(
      await catalog.getCourseLesson("course-live", "lesson-live", undefined, true),
    ).toMatchObject({ currentStudentPrice: 80, price: 100 });

    await catalog.createCourseLesson("course-live", {
      title: "New lesson",
      description: "Description",
      kind: "recorded",
      status: "published",
      availableFrom: "2026-01-01T00:00:00.000Z",
      availableUntil: "2027-01-01T00:00:00.000Z",
      access: "free",
      videoUploadToken: "video-ticket",
      attachmentUploadTokens: ["attachment-ticket"],
    });
    expect(lessonBody).toMatchObject({
      type: "recorded",
      isFree: true,
      videoUploadToken: "video-ticket",
    });
    expect(lessonBody).not.toHaveProperty("kind");

    await catalog.createLessonProduct({
      courseId: "course-live",
      lessonId: "lesson-live",
      name: "Lesson",
      price: 100,
      announcedLessonCount: 1,
      lessonIds: [],
    });
    expect(productBody).toMatchObject({ type: "lesson", lessonId: "lesson-live" });

    await catalog.updateCourseLesson("lesson-live", {
      kind: "recorded",
      access: "paid",
      price: 100,
      availableFrom: "2026-01-01T00:00:00.000Z",
      availableUntil: "2027-01-01T00:00:00.000Z",
    });
    expect(lessonPatchBody).toMatchObject({ type: "recorded", isFree: false });
    await catalog.updateCourseLessonStatus("lesson-live", "archived");
    await catalog.updatePackageProduct("product-live", { name: "Renamed", status: "archived" });
    expect(productPatchBody).toMatchObject({ name: "Renamed", isActive: false });
  });
});
