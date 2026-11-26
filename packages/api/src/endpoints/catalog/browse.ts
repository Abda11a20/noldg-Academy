import {
  BrowseTeacherDetailSchema,
  BrowseTeacherListSchema,
  BrowseTeacherQuerySchema,
  type BrowseTeacherQuery,
} from "../../contracts/browse";
import { AppError } from "../../errors/app-error";
import { adaptBrowseTeacherDetail, adaptBrowseTeacherList } from "../../adapters/browse";
import { capabilities } from "../../config/capabilities";
import { request } from "../../http/client";
import { apiMode } from "../../mocks/mode";
import { unknownResponseSchema } from "./common";

const DEFAULT_BROWSE_QUERY: BrowseTeacherQuery = {
  page: 1,
  pageSize: 12,
  q: "",
  sort: "newest",
};

function buildTeacherQuery(input: BrowseTeacherQuery): string {
  const query = new URLSearchParams({
    page: String(input.page),
    pageSize: String(input.pageSize),
    q: input.q,
    sort: input.sort,
  });
  if (apiMode === "mock" || capabilities.teacherBrowseFilters) {
    if (input.trackId && capabilities.studentTrackFilter) query.set("trackId", input.trackId);
    if (input.subjectId) query.set("subjectId", input.subjectId);
    if (input.minRating !== undefined) query.set("minRating", String(input.minRating));
    if (input.hasFreeLessons !== undefined)
      query.set("hasFreeLessons", String(input.hasFreeLessons));
    if (input.q) query.set("q", input.q);
    query.set("sort", input.sort);
  }
  return query.toString();
}

/** Loads a paginated teacher browse list; live mode sends only filters currently supported. */
export async function listBrowseTeachers(
  input?: Partial<BrowseTeacherQuery>,
  signal?: AbortSignal,
) {
  const query = BrowseTeacherQuerySchema.parse({ ...DEFAULT_BROWSE_QUERY, ...input });
  const page =
    apiMode === "live" ? `page=${query.page}&limit=${query.pageSize}` : buildTeacherQuery(query);
  const payload = await request(`teachers?${page}`, unknownResponseSchema, {
    ...(signal ? { signal } : {}),
  });
  const adapted = adaptBrowseTeacherList(payload, apiMode, query.page, query.pageSize);
  return BrowseTeacherListSchema.parse(adapted);
}

/** Loads one teacher's public profile and supported course previews. */
export async function getBrowseTeacher(teacherId: string, signal?: AbortSignal) {
  if (!teacherId.trim())
    throw new AppError({
      code: "VALIDATION_ERROR",
      status: 400,
      message_key: "errors:fieldInvalid",
    });
  const payload = await request(
    `teachers/${encodeURIComponent(teacherId)}`,
    unknownResponseSchema,
    {
      ...(signal ? { signal } : {}),
    },
  );
  const adapted = adaptBrowseTeacherDetail(payload, apiMode);
  return BrowseTeacherDetailSchema.parse({
    ...adapted,
    courses: capabilities.teacherBrowseCourses ? adapted.courses : [],
  });
}
