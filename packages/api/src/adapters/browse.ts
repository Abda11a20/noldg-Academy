import { AppError } from "../errors/app-error";
import {
  BrowseTeacherDetailSchema,
  BrowseTeacherListSchema,
  BrowseTeacherSchema,
  type BrowseTeacher,
} from "../contracts/browse";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 12;
const INVALID_RESPONSE = {
  code: "RESPONSE_VALIDATION_FAILED",
  status: 502,
  message_key: "errors:invalidResponse",
} as const;

function throwInvalidResponse(details?: unknown): never {
  throw new AppError({ ...INVALID_RESPONSE, ...(details === undefined ? {} : { details }) });
}

function unwrap(payload: unknown): unknown {
  if (typeof payload === "object" && payload !== null && "data" in payload) return payload.data;
  return payload;
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null) throwInvalidResponse();
  return value as Record<string, unknown>;
}

function mapLiveTeacher(value: unknown): BrowseTeacher {
  const source = record(value);
  const user = record(source.userId);
  const photo =
    typeof source.profileImage === "object" && source.profileImage !== null
      ? source.profileImage
      : undefined;
  const offerings = Array.isArray(source.offerings) ? source.offerings : [];
  const subjects = offerings.flatMap((entry) => {
    const item = record(entry);
    const subject = item.subjectId;
    if (typeof subject !== "object" || subject === null) return [];
    const entity = subject as Record<string, unknown>;
    return typeof entity.id === "string" && typeof entity.name === "string"
      ? [
          {
            id: entity.id,
            name: entity.name,
            ...(typeof entity.nameAr === "string" ? { nameAr: entity.nameAr } : {}),
          },
        ]
      : [];
  });
  const createdAt = source.createdAt;
  const parsed = BrowseTeacherSchema.safeParse({
    id: user.id ?? source.userId,
    name: user.name,
    photoUrl: photo && "url" in photo && typeof photo.url === "string" ? photo.url : null,
    bioExcerpt: typeof source.bio === "string" ? source.bio.slice(0, 180) : "",
    subjects,
    ratingAverage: null,
    ratingCount: 0,
    startingPrice: null,
    hasFreeLessons: false,
    createdAt,
  });
  if (!parsed.success) throwInvalidResponse(parsed.error.issues);
  return parsed.data;
}

/** Normalizes live teacher profile shapes while marking unsupported browse summaries absent. */
export function adaptBrowseTeacher(value: unknown, mode: "mock" | "live"): BrowseTeacher {
  if (mode === "mock") {
    const parsed = BrowseTeacherSchema.safeParse(value);
    if (parsed.success) return parsed.data;
    throwInvalidResponse(parsed.error.issues);
  }
  return mapLiveTeacher(unwrap(value));
}

/** Normalizes live list pagination and current public teacher-profile fields. */
export function adaptBrowseTeacherList(
  payload: unknown,
  mode: "mock" | "live",
  requestedPage = DEFAULT_PAGE,
  requestedPageSize = DEFAULT_PAGE_SIZE,
): ReturnType<typeof BrowseTeacherListSchema.parse> {
  if (mode === "mock") return normalizeMockList(payload);
  return normalizeLiveList(payload, requestedPage, requestedPageSize);
}

function normalizeMockList(payload: unknown): ReturnType<typeof BrowseTeacherListSchema.parse> {
  const parsed = BrowseTeacherListSchema.safeParse(payload);
  if (!parsed.success) throwInvalidResponse(parsed.error.issues);
  return parsed.data;
}

function normalizeLiveList(
  payload: unknown,
  requestedPage: number,
  requestedPageSize: number,
): ReturnType<typeof BrowseTeacherListSchema.parse> {
  const source = record(payload);
  const items = readLiveItems(source.data);
  const pagination = readPagination(source.pagination);
  const parsed = BrowseTeacherListSchema.safeParse(
    createLiveListResult(source, pagination, items, requestedPage, requestedPageSize),
  );
  if (!parsed.success) throwInvalidResponse(parsed.error.issues);
  return parsed.data;
}

function createLiveListResult(
  source: Record<string, unknown>,
  pagination: Record<string, unknown>,
  items: BrowseTeacher[],
  requestedPage: number,
  requestedPageSize: number,
) {
  return {
    items,
    page: pagination.page ?? requestedPage,
    pageSize: pagination.limit ?? requestedPageSize,
    total: pagination.total ?? source.count ?? items.length,
    ...(typeof source.serverNow === "string" ? { serverNow: source.serverNow } : {}),
  };
}

function readLiveItems(value: unknown): BrowseTeacher[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throwInvalidResponse();
  return value.map((item) => mapLiveTeacher(item));
}

function readPagination(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null) return {};
  return value as Record<string, unknown>;
}

/** Adapts a legacy public profile and leaves unsupported student course previews empty. */
export function adaptBrowseTeacherDetail(value: unknown, mode: "mock" | "live") {
  if (mode === "mock") {
    const parsed = BrowseTeacherDetailSchema.safeParse(value);
    if (parsed.success) return parsed.data;
    throwInvalidResponse(parsed.error.issues);
  }
  const source = record(unwrap(value));
  const teacher = mapLiveTeacher(source);
  const parsed = BrowseTeacherDetailSchema.safeParse({
    ...teacher,
    bio: typeof source.bio === "string" ? source.bio : "",
    courses: [],
  });
  if (!parsed.success) throwInvalidResponse(parsed.error.issues);
  return parsed.data;
}
