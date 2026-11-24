import { http, HttpResponse } from "msw";
import { API_BASE_URL } from "../../constants/http";
import { AcademicSubjectSchema, AcademicTrackSchema } from "../../contracts/admin";
import type { AcademicSubject, AcademicTrack } from "../../contracts/admin";
import { MOCK_APPLICATIONS, MOCK_SUBJECTS, MOCK_TRACKS } from "../fixtures/admin";
import { mockPendingTeacherState, resetMockPendingTeacherState } from "../state";

let tracks = structuredClone(MOCK_TRACKS);
let subjects = structuredClone(MOCK_SUBJECTS);
let applications = structuredClone(MOCK_APPLICATIONS);
let mappings: Record<string, string[]> = { "track-1": ["subject-1"] };
let accounts = [
  {
    id: "teacher-id",
    name: "Salma Hassan",
    email: "teacher-pending@example.test",
    role: "teacher",
    status: "active" as const,
  },
  {
    id: "teacher-user-2",
    name: "Omar Nabil",
    email: "omar@example.test",
    role: "teacher",
    status: "suspended" as const,
  },
];
const listEnvelope = <T>(items: T[], page: number, pageSize: number, total: number) => ({
  items,
  page,
  pageSize,
  total,
});

/** Resets mutable academic and teacher mock records between unit tests.
 */
export function resetAdminMockState(): void {
  tracks = structuredClone(MOCK_TRACKS);
  subjects = structuredClone(MOCK_SUBJECTS);
  applications = structuredClone(MOCK_APPLICATIONS);
  mappings = { "track-1": ["subject-1"] };
  accounts = [
    {
      id: "teacher-id",
      name: "Salma Hassan",
      email: "teacher-pending@example.test",
      role: "teacher",
      status: "active",
    },
    {
      id: "teacher-user-2",
      name: "Omar Nabil",
      email: "omar@example.test",
      role: "teacher",
      status: "suspended",
    },
  ];
  resetMockPendingTeacherState();
}

function readPage(url: URL): { page: number; pageSize: number } {
  return {
    page: Math.max(1, Number(url.searchParams.get("page") ?? 1)),
    pageSize: Math.max(
      1,
      Number(url.searchParams.get("limit") ?? url.searchParams.get("pageSize") ?? 20),
    ),
  };
}

/** Mock API handlers for administrative academic and teacher application endpoints. */
export const adminHandlers = [
  http.get(`${API_BASE_URL}/academic/tracks`, ({ request }) => {
    const url = new URL(request.url);
    const { page, pageSize } = readPage(url);
    const result = tracks.filter(
      (track) =>
        (!url.searchParams.has("system") || track.system === url.searchParams.get("system")) &&
        (!url.searchParams.has("stage") || track.stage === url.searchParams.get("stage")) &&
        (!url.searchParams.has("active") ||
          String(track.active) === url.searchParams.get("active")),
    );
    return HttpResponse.json(
      listEnvelope(
        result.slice((page - 1) * pageSize, page * pageSize),
        page,
        pageSize,
        result.length,
      ),
    );
  }),
  http.post(`${API_BASE_URL}/academic/tracks`, async ({ request }) => {
    const parsed = AcademicTrackSchema.pick({
      system: true,
      stage: true,
      grade: true,
      name: true,
    }).safeParse(await request.json());
    if (!parsed.success)
      return HttpResponse.json({ error: { code: "VALIDATION_ERROR" } }, { status: 400 });
    if (
      tracks.some(
        (track) =>
          track.system === parsed.data.system &&
          track.stage === parsed.data.stage &&
          track.grade === parsed.data.grade,
      )
    )
      return HttpResponse.json({ error: { code: "DUPLICATE_TRACK" } }, { status: 409 });
    const created = AcademicTrackSchema.parse({
      ...parsed.data,
      id: `track-${tracks.length + 1}`,
      active: true,
    });
    tracks.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),
  http.patch(`${API_BASE_URL}/academic/tracks/:trackId`, async ({ params, request }) => {
    const index = tracks.findIndex((track) => track.id === params.trackId);
    if (index < 0) return HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    const patch = (await request.json()) as Partial<AcademicTrack>;
    const current = tracks[index];
    if (!current) return HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    tracks[index] = AcademicTrackSchema.parse({ ...current, ...patch });
    return HttpResponse.json(tracks[index]);
  }),
  http.get(`${API_BASE_URL}/academic/subjects`, ({ request }) => {
    const { page, pageSize } = readPage(new URL(request.url));
    return HttpResponse.json(
      listEnvelope(
        subjects.slice((page - 1) * pageSize, page * pageSize),
        page,
        pageSize,
        subjects.length,
      ),
    );
  }),
  http.post(`${API_BASE_URL}/academic/subjects`, async ({ request }) => {
    const parsed = AcademicSubjectSchema.pick({ name: true }).safeParse(await request.json());
    if (!parsed.success)
      return HttpResponse.json({ error: { code: "VALIDATION_ERROR" } }, { status: 400 });
    const created = AcademicSubjectSchema.parse({
      ...parsed.data,
      id: `subject-${subjects.length + 1}`,
      active: true,
    });
    subjects.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),
  http.patch(`${API_BASE_URL}/academic/subjects/:subjectId`, async ({ params, request }) => {
    const index = subjects.findIndex((subject) => subject.id === params.subjectId);
    if (index < 0) return HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    const patch = (await request.json()) as Partial<AcademicSubject>;
    const current = subjects[index];
    if (!current) return HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    subjects[index] = AcademicSubjectSchema.parse({ ...current, ...patch });
    return HttpResponse.json(subjects[index]);
  }),
  http.get(`${API_BASE_URL}/academic/tracks/:trackId/subjects`, ({ params }) =>
    HttpResponse.json(
      subjects.filter((subject) => mappings[String(params.trackId)]?.includes(subject.id)),
    ),
  ),
  http.post(`${API_BASE_URL}/academic/tracks/:trackId/subjects`, async ({ params, request }) => {
    const body = (await request.json()) as { subjectId?: string };
    const trackId = String(params.trackId);
    if (
      !tracks.some((track) => track.id === trackId) ||
      !subjects.some((subject) => subject.id === body.subjectId)
    )
      return HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    mappings[trackId] = [...new Set([...(mappings[trackId] ?? []), body.subjectId ?? ""])];
    return HttpResponse.json({ success: true }, { status: 201 });
  }),
  http.delete(`${API_BASE_URL}/academic/tracks/:trackId/subjects/:subjectId`, ({ params }) => {
    const trackId = String(params.trackId);
    mappings[trackId] = (mappings[trackId] ?? []).filter((id) => id !== params.subjectId);
    return HttpResponse.json({ success: true });
  }),
  http.get(`${API_BASE_URL}/teachers/applications`, ({ request }) => {
    const url = new URL(request.url);
    const { page, pageSize } = readPage(url);
    const status = url.searchParams.get("status");
    const filtered = applications.filter((item) => !status || item.status === status);
    return HttpResponse.json(
      listEnvelope(
        filtered.slice((page - 1) * pageSize, page * pageSize),
        page,
        pageSize,
        filtered.length,
      ),
    );
  }),
  http.get(`${API_BASE_URL}/teachers/applications/:applicationId`, ({ params }) => {
    const application = applications.find((item) => item.id === params.applicationId);
    return application
      ? HttpResponse.json(application)
      : HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }),
  http.get(`${API_BASE_URL}/teachers/me/application`, () => {
    const application = applications[0];
    return application
      ? HttpResponse.json(application)
      : HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }),
  http.put(`${API_BASE_URL}/teachers/me/application`, async ({ request }) => {
    const body = await request.formData();
    const application = applications[0];
    if (!application) return HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    application.name = String(body.get("name") ?? application.name);
    application.email = String(body.get("email") ?? application.email);
    application.phone = String(body.get("phone") ?? application.phone);
    application.bio = String(body.get("bio") ?? application.bio);
    const rawOfferings = body.get("offerings");
    if (typeof rawOfferings === "string") {
      const parsed = JSON.parse(rawOfferings) as Array<{ trackId: string; subjectId: string }>;
      application.offerings = parsed.map((offering) => ({ ...offering }));
    }
    application.status = "pending";
    const submittedAt = new Date().toISOString();
    application.statusHistory = [
      ...application.statusHistory,
      { status: "pending", occurredAt: submittedAt },
    ];
    application.submittedAt = submittedAt;
    application.reviewedAt = undefined;
    mockPendingTeacherState.status = "pending";
    return HttpResponse.json(application, { status: 201 });
  }),
  http.post(`${API_BASE_URL}/teachers/applications/:applicationId/approve`, ({ params }) => {
    const application = applications.find((item) => item.id === params.applicationId);
    if (!application || application.status !== "pending")
      return HttpResponse.json({ error: { code: "ALREADY_REVIEWED" } }, { status: 409 });
    application.status = "approved";
    application.reviewedAt = new Date().toISOString();
    application.statusHistory = [
      ...application.statusHistory,
      { status: "approved", occurredAt: application.reviewedAt },
    ];
    mockPendingTeacherState.status = "approved";
    return HttpResponse.json(application);
  }),
  http.post(
    `${API_BASE_URL}/teachers/applications/:applicationId/reject`,
    async ({ params, request }) => {
      const application = applications.find((item) => item.id === params.applicationId);
      if (!application || application.status !== "pending")
        return HttpResponse.json({ error: { code: "ALREADY_REVIEWED" } }, { status: 409 });
      const body = (await request.json()) as { reason?: string };
      if (!body.reason?.trim())
        return HttpResponse.json({ error: { code: "VALIDATION_ERROR" } }, { status: 400 });
      application.status = "rejected";
      application.rejectionReason = body.reason;
      application.reviewedAt = new Date().toISOString();
      application.statusHistory = [
        ...application.statusHistory,
        { status: "rejected", occurredAt: application.reviewedAt, reason: body.reason },
      ];
      mockPendingTeacherState.status = "rejected";
      mockPendingTeacherState.rejectionReason = body.reason;
      return HttpResponse.json(application);
    },
  ),
  http.get(`${API_BASE_URL}/users`, ({ request }) => {
    const url = new URL(request.url);
    const { page, pageSize } = readPage(url);
    const status = url.searchParams.get("status")?.toLowerCase();
    const filtered = accounts.filter(
      (account) => account.role === "teacher" && (!status || account.status === status),
    );
    return HttpResponse.json(
      listEnvelope(
        filtered.slice((page - 1) * pageSize, page * pageSize),
        page,
        pageSize,
        filtered.length,
      ),
    );
  }),
  http.patch(`${API_BASE_URL}/users/:userId/status`, async ({ params, request }) => {
    const body = (await request.json()) as { status?: "active" | "suspended" };
    const account = accounts.find((item) => item.id === params.userId);
    if (!account || !body.status)
      return HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    account.status = body.status;
    return HttpResponse.json(account);
  }),
];
