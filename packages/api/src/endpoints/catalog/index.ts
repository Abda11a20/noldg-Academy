import {
  adaptCourse,
  adaptLesson,
  adaptUploadTicket,
  unwrapCatalogData,
} from "../../adapters/catalog";
import { AppError } from "../../errors/app-error";
import { capabilities } from "../../config/capabilities";
import { request } from "../../http/client";
import {
  CatalogLessonSchema,
  CourseListSchema,
  LessonInputSchema,
  LessonListSchema,
  type CatalogLesson,
  type LessonInput,
} from "../../contracts/catalog";
import type { ListUrlState } from "../../contracts/common";
import { apiMode } from "../../mocks/mode";
import { asArray, requireCapability, signalOption, unknownResponseSchema } from "./common";
import {
  createLessonProduct,
  getProductPricing,
  listTeacherProducts,
  updatePackageProduct,
} from "./products";
export { getBrowseTeacher, listBrowseTeachers } from "./browse";

const DEFAULT_PAGE = 1;
const COURSE_LOOKUP_PAGE_SIZE = 100;
type PossiblyUndefined<T> = { [Key in keyof T]?: T[Key] | undefined };

function makePage<T>(items: T[], state: ListUrlState) {
  const offset = (state.page - 1) * state.pageSize;
  return {
    items: items.slice(offset, offset + state.pageSize),
    page: state.page,
    pageSize: state.pageSize,
    total: items.length,
  };
}

function matchesAvailability(
  lesson: CatalogLesson,
  availability: string | undefined,
  now: number,
): boolean {
  if (!availability || availability === "all") return true;
  const isAvailable =
    new Date(lesson.availableFrom).getTime() <= now &&
    new Date(lesson.availableUntil).getTime() > now;
  return availability === "available" ? isAvailable : !isAvailable;
}

function matchesLesson(lesson: CatalogLesson, state: ListUrlState, now: number): boolean {
  const filters = state.filters;
  return (
    (!filters.status || lesson.status === filters.status) &&
    (!filters.access || lesson.access === filters.access) &&
    matchesAvailability(lesson, filters.availability, now) &&
    (!state.search || lesson.title.toLowerCase().includes(state.search.toLowerCase()))
  );
}

function liveLessonBody(values: PossiblyUndefined<LessonInput>): Record<string, unknown> {
  return {
    ...(values.title !== undefined ? { title: values.title } : {}),
    ...(values.description !== undefined ? { description: values.description } : {}),
    ...(values.kind !== undefined ? { type: values.kind } : {}),
    ...(values.access !== undefined ? { isFree: values.access === "free" } : {}),
    ...(values.availableFrom ? { availableFrom: values.availableFrom } : {}),
    ...(values.availableUntil ? { availableUntil: values.availableUntil } : {}),
    ...(values.videoUploadToken ? { videoUploadToken: values.videoUploadToken } : {}),
    ...(values.attachmentUploadTokens
      ? { attachmentUploadTokens: values.attachmentUploadTokens }
      : {}),
  };
}

function findLessonOnPages(
  courseId: string,
  lessonId: string,
  signal?: AbortSignal,
): Promise<CatalogLesson | undefined> {
  return (async () => {
    let page = DEFAULT_PAGE;
    let lesson: CatalogLesson | undefined;
    let hasNextPage = true;
    while (hasNextPage && !lesson) {
      const state: ListUrlState = {
        page,
        pageSize: COURSE_LOOKUP_PAGE_SIZE,
        search: "",
        filters: {},
      };
      const result = await listCourseLessons(courseId, state, signal);
      lesson = result.items.find((item) => item.id === lessonId);
      hasNextPage = result.items.length > 0 && page * COURSE_LOOKUP_PAGE_SIZE < result.total;
      page += 1;
    }
    return lesson;
  })();
}

async function addServerPrice(lesson: CatalogLesson, signal?: AbortSignal): Promise<CatalogLesson> {
  const product = (await listTeacherProducts(signal)).find(
    ({ product: item }) => item.lessonId === lesson.id,
  );
  if (!product) return lesson;
  let currentStudentPrice = product.pricing.currentPrice;
  if (product.product.status === "active") {
    try {
      currentStudentPrice = (await getProductPricing(product.product.id, signal)).pricing
        .currentPrice;
    } catch (error) {
      if (!(error instanceof AppError) || error.status !== 409) throw error;
    }
  }
  return CatalogLessonSchema.parse({
    ...lesson,
    price: product.product.price,
    ...(currentStudentPrice === undefined ? {} : { currentStudentPrice }),
  });
}

function listPath(path: string, state: ListUrlState): string {
  const params = new URLSearchParams({
    page: String(state.page),
    pageSize: String(state.pageSize),
  });
  if (state.search) params.set("q", state.search);
  for (const [key, value] of Object.entries(state.filters)) params.set(key, value);
  if (state.sort) params.set("sort", state.sort);
  return `${path}?${params.toString()}`;
}

/** Lists a teacher's courses and normalizes the current backend response shape. */
export async function listTeacherCourses(state: ListUrlState, signal?: AbortSignal) {
  const payload = await request(
    listPath("courses/my", state),
    unknownResponseSchema,
    signalOption(signal),
  );
  const items = asArray(unwrapCatalogData(payload)).map((item) => adaptCourse(item, apiMode));
  return CourseListSchema.parse(apiMode === "mock" ? payload : makePage(items, state));
}

/** Lists and filters lessons for one course, normalizing current backend lesson records. */
export async function listCourseLessons(
  courseId: string,
  state: ListUrlState,
  signal?: AbortSignal,
) {
  const payload = await request(
    listPath(`lessons/courses/${encodeURIComponent(courseId)}`, state),
    unknownResponseSchema,
    signalOption(signal),
  );
  const items = asArray(unwrapCatalogData(payload)).map((item) => adaptLesson(item, apiMode));
  const now = Date.now();
  const filtered = items.filter((lesson) => matchesLesson(lesson, state, now));
  return LessonListSchema.parse(apiMode === "mock" ? payload : makePage(filtered, state));
}

/** Creates a lesson after checking capabilities that the legacy backend cannot honor. */
export async function createCourseLesson(courseId: string, input: LessonInput) {
  const values = LessonInputSchema.parse(input);
  requireCapability(capabilities.lessonDrafts || values.status === "published");
  requireCapability(capabilities.liveLessons || values.kind !== "live");
  const body =
    apiMode === "mock"
      ? values
      : {
          title: values.title,
          description: values.description,
          type: values.kind,
          isFree: values.access === "free",
          availableFrom: values.availableFrom,
          availableUntil: values.availableUntil,
          ...(values.videoUploadToken ? { videoUploadToken: values.videoUploadToken } : {}),
          ...(values.attachmentUploadTokens
            ? { attachmentUploadTokens: values.attachmentUploadTokens }
            : {}),
        };
  const payload = await request(
    `lessons/courses/${encodeURIComponent(courseId)}`,
    unknownResponseSchema,
    {
      method: "POST",
      body,
    },
  );
  const lesson = CatalogLessonSchema.parse(adaptLesson(unwrapCatalogData(payload), apiMode));
  if (values.access === "paid" && values.price !== undefined) {
    await createLessonProduct({
      courseId,
      lessonId: lesson.id,
      name: values.title,
      price: values.price,
      announcedLessonCount: 1,
      lessonIds: capabilities.bundleLessons ? [lesson.id] : [],
    });
  }
  return lesson;
}

/** Updates lesson details while mapping target access and kind fields to the live contract. */
export async function updateCourseLesson(lessonId: string, input: Partial<LessonInput>) {
  const values = LessonInputSchema.partial().parse(input);
  requireCapability(capabilities.liveLessons || values.kind !== "live");
  const body = apiMode === "mock" ? values : liveLessonBody(values);
  const payload = await request(`lessons/${encodeURIComponent(lessonId)}`, unknownResponseSchema, {
    method: "PATCH",
    body,
  });
  const lesson = CatalogLessonSchema.parse(adaptLesson(unwrapCatalogData(payload), apiMode));
  if (values.access !== undefined || values.price !== undefined) {
    await syncLessonProduct(lesson, values.access ?? lesson.access, values.price);
  }
  return CatalogLessonSchema.parse({
    ...lesson,
    ...(values.price === undefined ? {} : { price: values.price }),
  });
}

async function syncLessonProduct(
  lesson: CatalogLesson,
  access: CatalogLesson["access"],
  price?: number,
): Promise<void> {
  const product = (await listTeacherProducts()).find(
    ({ product: item }) => item.lessonId === lesson.id,
  )?.product;
  if (access === "free") {
    if (product?.status === "active")
      await updatePackageProduct(product.id, { status: "archived" });
    return;
  }
  if (price === undefined) return;
  if (product) {
    await updatePackageProduct(product.id, { price, status: "active" });
    return;
  }
  if (apiMode === "live" && lesson.status !== "published") {
    throw new AppError({
      code: "CAPABILITY_UNAVAILABLE",
      status: 501,
      message_key: "errors:capabilityUnavailable",
    });
  }
  await createLessonProduct({
    courseId: lesson.courseId,
    lessonId: lesson.id,
    name: lesson.title,
    price,
    announcedLessonCount: 1,
    lessonIds: [],
  });
}

/** Changes publication status independently from the lesson availability window. */
export async function updateCourseLessonStatus(
  lessonId: string,
  status: "draft" | "published" | "archived",
) {
  const payload = await request(
    `lessons/${encodeURIComponent(lessonId)}/status`,
    unknownResponseSchema,
    {
      method: "PATCH",
      body: { status },
    },
  );
  return CatalogLessonSchema.parse(adaptLesson(unwrapCatalogData(payload), apiMode));
}

/** Requests a signed direct-upload ticket for a video or attachment. */
export async function requestLessonUploadTicket(
  courseId: string,
  input: { kind: "video" | "attachment"; name: string },
  signal?: AbortSignal,
) {
  const payload = await request(
    `lessons/courses/${encodeURIComponent(courseId)}/uploads/sign`,
    unknownResponseSchema,
    {
      method: "POST",
      body: input,
      ...signalOption(signal),
    },
  );
  return adaptUploadTicket(payload, apiMode);
}

export {
  createLessonProduct,
  getProductPricing,
  listTeacherProducts,
  updatePackageProduct,
} from "./products";

/** Gets a lesson from its owning course list because the current backend has no lesson detail route. */
export async function getCourseLesson(
  courseId: string,
  lessonId: string,
  signal?: AbortSignal,
  includeProductPricing = false,
) {
  const lesson = await findLessonOnPages(courseId, lessonId, signal);
  if (!lesson)
    throw new AppError({ code: "NOT_FOUND", status: 404, message_key: "errors:requestFailed" });
  if (!includeProductPricing) return lesson;
  return addServerPrice(lesson, signal);
}
