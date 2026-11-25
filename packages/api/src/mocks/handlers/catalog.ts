import { delay, http, HttpResponse } from "msw";
import {
  CatalogLessonSchema,
  CatalogProductSchema,
  type CatalogLesson,
  type CatalogProduct,
} from "../../contracts/catalog";
import { API_BASE_URL } from "../../constants/http";
import {
  DEFAULT_MOCK_ANNOUNCED_LESSON_COUNT,
  MOCK_COURSES,
  MOCK_LESSONS,
  MOCK_PLATFORM_COMMISSION_PERCENTAGE,
  MOCK_PRODUCTS,
  MOCK_UPLOAD_TICKET,
  MOCK_VIDEO_READY_POLL_COUNT,
  MOCK_VIDEO_FAILED_POLL_COUNT,
  MOCK_ZERO_AMOUNT,
} from "../fixtures/catalog";

let courses = structuredClone(MOCK_COURSES);
let lessons = structuredClone(MOCK_LESSONS);
let products = structuredClone(MOCK_PRODUCTS);
let nextId = 2;
let expiredTicketCount = 0;
const processingPolls = new Map<string, number>();

/** Resets catalog, lesson, and package mocks to their original fixtures. */
export function resetCatalogMockState(): void {
  courses = structuredClone(MOCK_COURSES);
  lessons = structuredClone(MOCK_LESSONS);
  products = structuredClone(MOCK_PRODUCTS);
  nextId = 2;
  expiredTicketCount = 0;
  processingPolls.clear();
}

function paged<T>(items: T[], url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.max(1, Number(url.searchParams.get("pageSize") ?? 20));
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total: items.length,
  };
}

function pricingForMock(product: CatalogProduct) {
  const lessonCount = product.announcedLessonCount ?? DEFAULT_MOCK_ANNOUNCED_LESSON_COUNT;
  const hasPublishedLesson =
    product.type === "lesson"
      ? lessons.some((lesson) => lesson.id === product.lessonId && lesson.status === "published")
      : lessons.some(
          (lesson) => lesson.courseId === product.courseId && lesson.status === "published",
        );
  return {
    fullPrice: product.price,
    currentPrice: product.price,
    announcedLessonCount: lessonCount,
    remainingLessonCount: lessonCount,
    commissionPercentage: MOCK_PLATFORM_COMMISSION_PERCENTAGE,
    platformAmount: MOCK_ZERO_AMOUNT,
    teacherAmount: product.price,
    isPurchasable: product.status === "active" && hasPublishedLesson,
  };
}

function matchesLessonQuery(lesson: CatalogLesson, url: URL, now: number): boolean {
  const availability = url.searchParams.get("availability");
  const isAvailable =
    new Date(lesson.availableFrom).getTime() <= now &&
    new Date(lesson.availableUntil).getTime() > now;
  return (
    (!url.searchParams.has("status") || lesson.status === url.searchParams.get("status")) &&
    (!url.searchParams.has("access") || lesson.access === url.searchParams.get("access")) &&
    (!availability || (availability === "available" ? isAvailable : !isAvailable)) &&
    (!url.searchParams.has("q") ||
      lesson.title.toLowerCase().includes(url.searchParams.get("q")!.toLowerCase()))
  );
}

function uploadScenario(
  name: string | undefined,
): "success" | "failure" | "slow" | "network" | "expired" {
  if (name?.startsWith("network-failure")) return "network";
  if (name?.startsWith("failure")) return "failure";
  if (name?.startsWith("slow")) return "slow";
  if (name?.startsWith("expired") && expiredTicketCount === 0) {
    expiredTicketCount += 1;
    return "expired";
  }
  return "success";
}

/** Mock handlers for teacher courses, lesson editing, signed uploads, and products. */
export const catalogHandlers = [
  http.options(
    "https://api.cloudinary.com/mock-upload",
    ({ request }) =>
      new HttpResponse(null, {
        headers: {
          "access-control-allow-origin": request.headers.get("origin") ?? "*",
          "access-control-allow-methods": "POST, OPTIONS",
          "access-control-allow-headers":
            request.headers.get("access-control-request-headers") ?? "*",
        },
      }),
  ),
  http.get(`${API_BASE_URL}/courses/my`, ({ request }) =>
    HttpResponse.json(paged(courses, new URL(request.url))),
  ),
  http.get(`${API_BASE_URL}/lessons/courses/:courseId`, ({ params, request }) => {
    const owned = lessons
      .filter((lesson) => lesson.courseId === params.courseId)
      .map((lesson) => {
        if (lesson.videoState !== "processing") return lesson;
        const polls = (processingPolls.get(lesson.id) ?? 0) + 1;
        processingPolls.set(lesson.id, polls);
        const shouldFail = lesson.video?.publicId === "mock-video-processing-failed";
        const threshold = shouldFail ? MOCK_VIDEO_FAILED_POLL_COUNT : MOCK_VIDEO_READY_POLL_COUNT;
        if (polls < threshold) return lesson;
        const processed = {
          ...lesson,
          videoState: shouldFail ? ("failed" as const) : ("ready" as const),
        };
        lessons = lessons.map((current) => (current.id === lesson.id ? processed : current));
        return processed;
      });
    const url = new URL(request.url);
    const now = Date.now();
    const filtered = owned.filter((lesson) => matchesLessonQuery(lesson, url, now));
    return HttpResponse.json(paged(filtered, url));
  }),
  http.post(`${API_BASE_URL}/lessons/courses/:courseId/uploads/sign`, async ({ request }) => {
    const body = (await request.json()) as { name?: string };
    const scenario = uploadScenario(body.name);
    return HttpResponse.json({
      ...MOCK_UPLOAD_TICKET,
      ...(body.name?.startsWith("processing-failed")
        ? { uploadToken: "mock-video-processing-failed" }
        : {}),
      fields: { mockScenario: scenario },
    });
  }),
  http.post("https://api.cloudinary.com/mock-upload", async ({ request }) => {
    const formBody = await request.text();
    const scenario = /name="mockScenario"\r\n\r\n([^\r\n]+)/.exec(formBody)?.[1];
    if (scenario === "network") return HttpResponse.error();
    const headers = { "access-control-allow-origin": request.headers.get("origin") ?? "*" };
    if (scenario === "failure")
      return HttpResponse.json({ error: { code: "UPLOAD_REJECTED" } }, { headers, status: 400 });
    if (scenario === "expired")
      return HttpResponse.json({ error: { code: "UPLOAD_EXPIRED" } }, { headers, status: 410 });
    if (scenario === "slow") await delay(250);
    return HttpResponse.json({ success: true }, { headers });
  }),
  http.post(`${API_BASE_URL}/lessons/courses/:courseId`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const created = CatalogLessonSchema.parse({
      ...body,
      id: `lesson-${nextId++}`,
      courseId: params.courseId,
      status: body.status ?? "draft",
      videoState: body.videoUploadToken ? "processing" : "none",
      video: body.videoUploadToken
        ? {
            publicId:
              body.videoUploadToken === "mock-video-processing-failed"
                ? "mock-video-processing-failed"
                : "mock-video",
            format: "mp4",
          }
        : undefined,
      attachments: [],
    });
    lessons = [...lessons, created];
    return HttpResponse.json(created, { status: 201 });
  }),
  http.patch(`${API_BASE_URL}/lessons/:lessonId`, async ({ params, request }) => {
    const index = lessons.findIndex((lesson) => lesson.id === params.lessonId);
    if (index < 0) return HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    const patch = (await request.json()) as Partial<CatalogLesson> & {
      videoUploadToken?: string;
      attachmentUploadTokens?: string[];
    };
    const current = lessons[index];
    if (!current) return HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    const { videoUploadToken, attachmentUploadTokens, ...fields } = patch;
    lessons[index] = CatalogLessonSchema.parse({
      ...current,
      ...fields,
      ...(videoUploadToken
        ? {
            videoState: "processing",
            video: {
              publicId:
                videoUploadToken === "mock-video-processing-failed"
                  ? "mock-video-processing-failed"
                  : `mock-video-${videoUploadToken}`,
              format: "mp4",
            },
          }
        : {}),
      ...(attachmentUploadTokens?.length
        ? {
            attachments: [
              ...current.attachments,
              ...attachmentUploadTokens.map((token) => ({
                publicId: token,
                name: token,
                format: "pdf",
              })),
            ],
          }
        : {}),
    });
    return HttpResponse.json(lessons[index]);
  }),
  http.patch(`${API_BASE_URL}/lessons/:lessonId/status`, async ({ params, request }) => {
    const index = lessons.findIndex((lesson) => lesson.id === params.lessonId);
    if (index < 0) return HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    const body = (await request.json()) as { status: CatalogLesson["status"] };
    const current = lessons[index];
    if (!current) return HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    lessons[index] = CatalogLessonSchema.parse({ ...current, status: body.status });
    return HttpResponse.json(lessons[index]);
  }),
  http.get(`${API_BASE_URL}/products/my`, () =>
    HttpResponse.json(
      products.map((product) => ({
        product,
        pricing: pricingForMock(product),
      })),
    ),
  ),
  http.post(`${API_BASE_URL}/products`, async ({ request }) => {
    const body = (await request.json()) as Omit<CatalogProduct, "id" | "status">;
    const product = CatalogProductSchema.parse({
      ...body,
      id: `product-${nextId++}`,
      status: "active",
    });
    products = [...products, product];
    return HttpResponse.json({ product, pricing: pricingForMock(product) }, { status: 201 });
  }),
  http.patch(`${API_BASE_URL}/products/:productId`, async ({ params, request }) => {
    const index = products.findIndex((product) => product.id === params.productId);
    if (index < 0) return HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    const patch = (await request.json()) as Partial<CatalogProduct>;
    const current = products[index];
    if (!current) return HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    products[index] = CatalogProductSchema.parse({ ...current, ...patch });
    return HttpResponse.json({
      product: products[index],
      pricing: pricingForMock(products[index]),
    });
  }),
  http.get(`${API_BASE_URL}/products/:productId/pricing`, ({ params }) => {
    const product = products.find((item) => item.id === params.productId);
    if (!product) return HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    const pricing = pricingForMock(product);
    return pricing.isPurchasable
      ? HttpResponse.json({ product, pricing })
      : HttpResponse.json({ error: { code: "NOT_PURCHASABLE" } }, { status: 409 });
  }),
];
