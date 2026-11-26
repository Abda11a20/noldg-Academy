import { http, HttpResponse } from "msw";
import {
  BrowseTeacherQuerySchema,
  BrowseTeacherSchema,
  type BrowseTeacherQuery,
} from "../../contracts/browse";
import { API_BASE_URL } from "../../constants/http";
import { MOCK_BROWSE_TEACHERS } from "../fixtures/browse";

const MOCK_SERVER_NOW = "2026-11-26T05:00:00.000Z";

function matchesTrack(teacher: (typeof MOCK_BROWSE_TEACHERS)[number], state: BrowseTeacherQuery) {
  return !state.trackId || teacher.courses.some((course) => course.track.id === state.trackId);
}

function matchesSubject(teacher: (typeof MOCK_BROWSE_TEACHERS)[number], state: BrowseTeacherQuery) {
  return !state.subjectId || teacher.subjects.some((subject) => subject.id === state.subjectId);
}

function matchesRating(teacher: (typeof MOCK_BROWSE_TEACHERS)[number], state: BrowseTeacherQuery) {
  return state.minRating === undefined || (teacher.ratingAverage ?? 0) >= state.minRating;
}

function matchesFree(teacher: (typeof MOCK_BROWSE_TEACHERS)[number], state: BrowseTeacherQuery) {
  return state.hasFreeLessons === undefined || teacher.hasFreeLessons === state.hasFreeLessons;
}

function matchesSearch(teacher: (typeof MOCK_BROWSE_TEACHERS)[number], state: BrowseTeacherQuery) {
  if (!state.q) return true;
  return `${teacher.name} ${teacher.nameAr ?? ""}`.toLowerCase().includes(state.q.toLowerCase());
}

function matchesTeacher(
  teacher: (typeof MOCK_BROWSE_TEACHERS)[number],
  state: BrowseTeacherQuery,
): boolean {
  return [
    matchesTrack(teacher, state),
    matchesSubject(teacher, state),
    matchesRating(teacher, state),
    matchesFree(teacher, state),
    matchesSearch(teacher, state),
  ].every(Boolean);
}

function sortTeachers(teachers: typeof MOCK_BROWSE_TEACHERS, sort: BrowseTeacherQuery["sort"]) {
  if (sort === "rating")
    return teachers.sort((left, right) => (right.ratingAverage ?? 0) - (left.ratingAverage ?? 0));
  if (sort === "priceAsc")
    return teachers.sort(
      (left, right) =>
        (left.startingPrice ?? Number.MAX_SAFE_INTEGER) -
        (right.startingPrice ?? Number.MAX_SAFE_INTEGER),
    );
  if (sort === "priceDesc")
    return teachers.sort((left, right) => (right.startingPrice ?? 0) - (left.startingPrice ?? 0));
  return teachers;
}

function matchesFilters(url: URL): typeof MOCK_BROWSE_TEACHERS {
  const query = BrowseTeacherQuerySchema.safeParse({
    page: Number(url.searchParams.get("page") ?? 1),
    pageSize: Number(url.searchParams.get("pageSize") ?? 12),
    q: url.searchParams.get("q") ?? "",
    ...(url.searchParams.get("trackId") ? { trackId: url.searchParams.get("trackId")! } : {}),
    ...(url.searchParams.get("subjectId") ? { subjectId: url.searchParams.get("subjectId")! } : {}),
    ...(url.searchParams.get("minRating")
      ? { minRating: Number(url.searchParams.get("minRating")) }
      : {}),
    ...(url.searchParams.get("hasFreeLessons")
      ? { hasFreeLessons: url.searchParams.get("hasFreeLessons") === "true" }
      : {}),
    sort: url.searchParams.get("sort") ?? "newest",
  });
  if (!query.success) return [];
  return sortTeachers(
    MOCK_BROWSE_TEACHERS.filter((teacher) => matchesTeacher(teacher, query.data)),
    query.data.sort,
  );
}

function handleTeacherList(request: Request) {
  const url = new URL(request.url);
  const items = matchesFilters(url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.max(1, Number(url.searchParams.get("pageSize") ?? 12));
  return HttpResponse.json({
    items: items
      .slice((page - 1) * pageSize, page * pageSize)
      .map((teacher) => BrowseTeacherSchema.parse(teacher)),
    page,
    pageSize,
    total: items.length,
    serverNow: MOCK_SERVER_NOW,
  });
}

function handleTeacherDetail(teacherId: string) {
  const teacher = MOCK_BROWSE_TEACHERS.find((item) => item.id === teacherId);
  if (!teacher) return HttpResponse.json({ error: { code: "TEACHER_NOT_FOUND" } }, { status: 404 });
  return HttpResponse.json(teacher);
}

/** Mock handlers for student teacher discovery and profile previews. */
export const browseHandlers = [
  http.get(`${API_BASE_URL}/teachers`, ({ request }) => handleTeacherList(request)),
  http.get(`${API_BASE_URL}/teachers/:teacherId`, ({ params }) =>
    handleTeacherDetail(String(params.teacherId)),
  ),
];
