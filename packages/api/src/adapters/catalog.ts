import { AppError } from "../errors/app-error";
import type { ZodType } from "zod";
import {
  CatalogCourseSchema,
  CatalogLessonSchema,
  CatalogProductSchema,
  UploadTicketSchema,
} from "../contracts/catalog";
import { adaptAcademicSubject, adaptAcademicTrack } from "./admin";

function unwrapData(payload: unknown): unknown {
  if (typeof payload !== "object" || payload === null || !("data" in payload)) return payload;
  return payload.data;
}

function parseMock<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError({
      code: "RESPONSE_VALIDATION_FAILED",
      status: 502,
      message_key: "errors:invalidResponse",
    });
  }
  return result.data;
}

function nestedId(value: unknown): string {
  if (typeof value === "string") return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string"
  ) {
    return value.id;
  }
  throw new AppError({
    code: "RESPONSE_VALIDATION_FAILED",
    status: 502,
    message_key: "errors:invalidResponse",
  });
}

/** Maps current course records with nested academic models to the target course contract. */
export function adaptCourse(value: unknown, mode: "mock" | "live" = "mock") {
  if (mode === "mock") return parseMock(CatalogCourseSchema, value);
  if (typeof value !== "object" || value === null)
    throw new AppError({
      code: "RESPONSE_VALIDATION_FAILED",
      status: 502,
      message_key: "errors:invalidResponse",
    });
  const source = value as Record<string, unknown>;
  const track = adaptAcademicTrack(source.trackId, "live");
  const subject = adaptAcademicSubject(source.subjectId, "live");
  const parsed = CatalogCourseSchema.safeParse({
    id: source.id,
    track,
    subject,
    ...(typeof source.lessonCount === "number" ? { lessonCount: source.lessonCount } : {}),
    ...(typeof source.packageCount === "number" ? { packageCount: source.packageCount } : {}),
    ...(source.status === "active" || source.status === "inactive"
      ? { status: source.status }
      : {}),
  });
  if (!parsed.success)
    throw new AppError({
      code: "RESPONSE_VALIDATION_FAILED",
      status: 502,
      message_key: "errors:invalidResponse",
    });
  return parsed.data;
}

/** Adapts legacy lesson field names and video metadata to the target lesson contract. */
export function adaptLesson(value: unknown, mode: "mock" | "live" = "mock") {
  if (mode === "mock") return parseMock(CatalogLessonSchema, value);
  if (typeof value !== "object" || value === null)
    throw new AppError({
      code: "RESPONSE_VALIDATION_FAILED",
      status: 502,
      message_key: "errors:invalidResponse",
    });
  const source = value as Record<string, unknown>;
  const video = adaptLegacyVideo(source.video);
  const parsed = CatalogLessonSchema.safeParse({
    ...source,
    kind: source.type,
    access: source.isFree ? "free" : "paid",
    videoState: source.video ? "ready" : "none",
    video,
    attachments: Array.isArray(source.attachments) ? source.attachments : [],
  });
  if (!parsed.success)
    throw new AppError({
      code: "RESPONSE_VALIDATION_FAILED",
      status: 502,
      message_key: "errors:invalidResponse",
    });
  return parsed.data;
}

function adaptLegacyVideo(value: unknown): { publicId: string; format: string } | undefined {
  if (
    typeof value !== "object" ||
    value === null ||
    !("publicId" in value) ||
    typeof value.publicId !== "string"
  ) {
    return undefined;
  }
  const format = "format" in value && typeof value.format === "string" ? value.format : "unknown";
  return { publicId: value.publicId, format };
}

/** Maps a legacy product model to the target package product contract. */
export function adaptProduct(value: unknown, mode: "mock" | "live" = "mock") {
  if (mode === "mock") return parseMock(CatalogProductSchema, value);
  if (typeof value !== "object" || value === null)
    throw new AppError({
      code: "RESPONSE_VALIDATION_FAILED",
      status: 502,
      message_key: "errors:invalidResponse",
    });
  const source = value as Record<string, unknown>;
  const courseId = nestedId(source.courseId);
  const parsed = CatalogProductSchema.safeParse({
    id: source.id,
    courseId,
    type: source.type,
    name: source.name,
    price: source.price,
    ...(typeof source.lessonId === "string" ? { lessonId: source.lessonId } : {}),
    announcedLessonCount: source.announcedLessonCount,
    status: source.isActive === false ? "archived" : "active",
  });
  if (!parsed.success)
    throw new AppError({
      code: "RESPONSE_VALIDATION_FAILED",
      status: 502,
      message_key: "errors:invalidResponse",
    });
  return parsed.data;
}

/** Normalizes provider form fields to strings while preserving the opaque upload token.
 * @param value Current backend or target ticket payload.
 * @param mode Active API mode; mock tickets already use the target shape.
 */
export function adaptUploadTicket(value: unknown, mode: "mock" | "live" = "mock") {
  if (mode === "mock") return parseMock(UploadTicketSchema, value);
  const source = unwrapData(value);
  if (
    typeof source !== "object" ||
    source === null ||
    !("url" in source) ||
    !("fields" in source) ||
    !("uploadToken" in source)
  ) {
    throw new AppError({
      code: "RESPONSE_VALIDATION_FAILED",
      status: 502,
      message_key: "errors:invalidResponse",
    });
  }
  if (typeof source.fields !== "object" || source.fields === null) {
    throw new AppError({
      code: "RESPONSE_VALIDATION_FAILED",
      status: 502,
      message_key: "errors:invalidResponse",
    });
  }
  const fields = Object.fromEntries(
    Object.entries(source.fields).map(([key, field]) => [key, String(field)]),
  );
  return UploadTicketSchema.parse({ method: "form-post", ...source, fields });
}

/** Extracts a legacy API response's data payload. */
export function unwrapCatalogData(payload: unknown): unknown {
  return unwrapData(payload);
}
