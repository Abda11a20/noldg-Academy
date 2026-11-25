import { expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { API_BASE_URL } from "../constants/http";
import { nodeServer } from "../mocks/node";
import {
  addTrackSubject, createSubject, createTrack, getMyTeacherApplication, getTeacherApplication,
  getTeacherOfferingCatalog, listSubjects, listTeacherAccounts, listTeacherApplications,
  listTrackSubjects, listTracks, removeTrackSubject, resubmitTeacherApplication,
  reviewTeacherApplication, updateSubject, updateTeacherAccountStatus, updateTrack,
} from "./admin";

const defaultListState = { page: 1, pageSize: 10, search: "", filters: {} };

it("serves normalized mock track pages and validates academic writes", async () => {
  const result = await listTracks(defaultListState);
  expect(result.items.length).toBeGreaterThan(0);
  expect(result.pageSize).toBe(10);
  await expect(
    createTrack({ system: "american_diploma", stage: "prep", grade: 1, name: "Invalid" }),
  ).rejects.toThrow();
});

it("reviews a teacher application through the named decision endpoint", async () => {
  const result = await reviewTeacherApplication("application-1", "approved");
  expect(result.status).toBe("approved");
});

it("exercises academic and teacher administration endpoints in mock mode", async () => {
  const createdTrack = await createTrack({
    system: "general",
    stage: "secondary",
    grade: 2,
    name: "Second secondary",
  });
  expect((await updateTrack(createdTrack.id, { active: false })).active).toBe(false);
  expect((await listTracks(defaultListState)).items.length).toBeGreaterThan(0);
  expect((await listTracks(defaultListState, { active: "false" })).items).toHaveLength(1);

  const createdSubject = await createSubject("Chemistry");
  expect((await updateSubject(createdSubject.id, { active: false })).active).toBe(false);
  await addTrackSubject("track-1", "subject-2");
  expect(await listTrackSubjects("track-1")).toHaveLength(2);
  await removeTrackSubject("track-1", "subject-2");
  expect(
    (await listSubjects({ ...defaultListState, filters: { active: "true" } })).items.length,
  ).toBeGreaterThan(0);

  const page = await listTeacherApplications(defaultListState, "pending");
  expect(page.items).toHaveLength(1);
  await expect(getTeacherApplication("missing-application")).rejects.toThrow();
  expect((await getTeacherApplication("application-1")).status).toBe("pending");
  expect(
    (
      await getMyTeacherApplication({
        id: "teacher-id",
        name: "Salma Hassan",
        email: "teacher-pending@example.test",
      })
    ).id,
  ).toBe("application-1");
  expect((await getTeacherOfferingCatalog()).tracks).toHaveLength(1);

  await reviewTeacherApplication(
    "application-1",
    "rejected",
    "Please add more teaching experience.",
  );
  await expect(
    reviewTeacherApplication("application-1", "rejected", "Please add more teaching experience."),
  ).rejects.toThrow();
  const body = new FormData();
  body.set("name", "Salma Hassan");
  body.set("email", "teacher-pending@example.test");
  body.set("phone", "+201000000001");
  body.set("bio", "Experienced mathematics teacher");
  body.set("offerings", JSON.stringify([{ trackId: "track-1", subjectId: "subject-1" }]));
  await resubmitTeacherApplication(body, {
    id: "teacher-id",
    name: "Salma Hassan",
    email: "teacher-pending@example.test",
  });

  expect((await listTeacherAccounts(defaultListState, "active")).items).toHaveLength(1);
  await updateTeacherAccountStatus("teacher-id", "suspended", "Repeated policy violations.");
  expect((await listTeacherAccounts(defaultListState, "suspended")).items).toHaveLength(2);
});

function installLegacyAdminHandlers(
  legacyTrack: Record<string, unknown>,
  legacySubject: Record<string, unknown>,
  legacyApplication: Record<string, unknown>,
): void {
  let applicationStatus = String(legacyApplication.approvalStatus);
  nodeServer.use(
    http.get(`${API_BASE_URL}/academic/tracks`, () => HttpResponse.json({ data: [legacyTrack] })),
    http.post(`${API_BASE_URL}/academic/tracks`, async ({ request }) => {
      const body = (await request.json()) as { system: string; stage: string };
      expect(body.system).toBe("al_azhar");
      expect(body.stage).toBe("preparatory");
      return HttpResponse.json({ data: { ...legacyTrack, name: "Created track" } });
    }),
    http.patch(`${API_BASE_URL}/academic/tracks/:trackId`, async ({ request }) => {
      expect((await request.json() as Record<string, unknown>).isActive).toBe(false);
      return HttpResponse.json({ data: { ...legacyTrack, isActive: false } });
    }),
    http.get(`${API_BASE_URL}/academic/subjects`, () => HttpResponse.json({ data: [legacySubject] })),
    http.post(`${API_BASE_URL}/academic/subjects`, () => HttpResponse.json({ data: legacySubject })),
    http.patch(`${API_BASE_URL}/academic/subjects/:subjectId`, () =>
      HttpResponse.json({ data: { ...legacySubject, isActive: false } }),
    ),
    http.get(`${API_BASE_URL}/academic/tracks/:trackId/subjects`, () => HttpResponse.json({ data: [legacySubject] })),
    http.post(`${API_BASE_URL}/academic/tracks/:trackId/subjects`, () => HttpResponse.json({ success: true })),
    http.delete(`${API_BASE_URL}/academic/tracks/:trackId/subjects/:subjectId`, () => HttpResponse.json({ success: true })),
    http.get(`${API_BASE_URL}/teachers/applications`, ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get("page") ?? 1);
      const matchesStatus = url.searchParams.get("status") === applicationStatus;
      const pageItems = matchesStatus
        ? [{ ...legacyApplication, id: page === 1 ? "other-application" : legacyApplication.id, approvalStatus: applicationStatus }]
        : [];
      return HttpResponse.json({ data: pageItems, pagination: { page, limit: 1, total: matchesStatus ? 2 : 0 } });
    }),
    http.get(`${API_BASE_URL}/teachers/me/application`, () => HttpResponse.json({ data: legacyApplication })),
    http.get(`${API_BASE_URL}/academic/catalog`, () => HttpResponse.json({ data: [] })),
    http.patch(`${API_BASE_URL}/teachers/applications/:applicationId/review`, async ({ request }) => {
      const body = (await request.json()) as { status: string };
      applicationStatus = body.status;
      return HttpResponse.json({ data: { ...legacyApplication, userId: "legacy-teacher", approvalStatus: body.status, offerings: [{ trackId: "legacy-track", subjectId: "legacy-subject" }] } });
    }),
    http.get(`${API_BASE_URL}/users`, () => HttpResponse.json({ data: [{ id: "legacy-teacher", name: "Salma Hassan", email: "salma@example.test", status: "ACTIVE" }], pagination: { page: 1, limit: 10, total: 1 } })),
    http.patch(`${API_BASE_URL}/users/:userId/status`, async ({ request }) => {
      expect(await request.json()).toEqual({ status: "suspended" });
      return HttpResponse.json({ success: true });
    }),
    http.post(`${API_BASE_URL}/teachers/applications`, async ({ request }) => {
      const body = await request.formData();
      expect(body.get("name")).toBeNull();
      expect(body.get("email")).toBeNull();
      expect(body.get("phone")).toBeNull();
      expect(body.get("bio")).toBe("Updated bio");
      return HttpResponse.json({ data: legacyApplication });
    }),
  );
}

it("normalizes the current admin endpoints when live capabilities are enabled", async () => {
  vi.stubEnv("VITE_API_MODE", "live");
  vi.stubEnv("VITE_ADMIN_ACADEMIC_ACCESS", "true");
  vi.stubEnv("VITE_ADMIN_SEARCH_PAGINATION", "true");
  vi.resetModules();

  const legacyTrack = {
    id: "legacy-track",
    system: "al_azhar",
    stage: "preparatory",
    grade: 1,
    name: "First preparatory",
    isActive: true,
  };
  const legacySubject = { id: "legacy-subject", name: "Arabic", isActive: true };
  const legacyApplication = {
    id: "legacy-application",
    userId: {
      id: "legacy-teacher",
      name: "Salma Hassan",
      email: "salma@example.test",
      phone: "+201000000001",
    },
    bio: "Experienced teacher",
    approvalStatus: "pending",
    createdAt: "2026-11-20T12:00:00.000Z",
    offerings: [{ trackId: legacyTrack, subjectId: legacySubject }],
  };
  installLegacyAdminHandlers(legacyTrack, legacySubject, legacyApplication);

  try {
    const adminApi = await import("./admin");
    const listState = { ...defaultListState, pageSize: 2 };
    expect((await adminApi.listTracks(listState)).items[0]?.system).toBe("azhar");
    expect(
      (
        await adminApi.createTrack({
          system: "azhar",
          stage: "prep",
          grade: 1,
          name: "Created track",
        })
      ).system,
    ).toBe("azhar");
    expect((await adminApi.updateTrack("legacy-track", { active: false })).active).toBe(false);
    expect((await adminApi.listSubjects(listState)).items[0]?.active).toBe(true);
    expect((await adminApi.createSubject("Arabic")).active).toBe(true);
    expect((await adminApi.updateSubject("legacy-subject", { active: false })).active).toBe(false);
    expect(await adminApi.listTrackSubjects("legacy-track")).toHaveLength(1);
    await adminApi.addTrackSubject("legacy-track", "legacy-subject");
    await adminApi.removeTrackSubject("legacy-track", "legacy-subject");
    expect((await adminApi.listTeacherApplications(listState, "pending")).items[0]?.status).toBe(
      "pending",
    );
    nodeServer.use(
      http.get(`${API_BASE_URL}/teachers/applications`, () =>
        HttpResponse.json({
          data: [legacyApplication],
          pagination: { page: 2, limit: 2, total: 3 },
        }),
      ),
    );
    const pageTwo = await adminApi.listTeacherApplications({ ...listState, page: 2 }, "pending");
    expect([pageTwo.items[0]?.id, pageTwo.page, pageTwo.pageSize, pageTwo.total]).toEqual([
      "legacy-application", 2, 2, 3,
    ]);
    nodeServer.resetHandlers(); installLegacyAdminHandlers(legacyTrack, legacySubject, legacyApplication);
    expect((await adminApi.getTeacherApplication("legacy-application")).id).toBe(
      "legacy-application",
    );
    await expect(adminApi.getTeacherApplication("missing-application")).rejects.toMatchObject({ status: 404 });
    expect(
      (
        await adminApi.getMyTeacherApplication({
          id: "legacy-teacher",
          name: "Salma Hassan",
          email: "salma@example.test",
        })
      ).id,
    ).toBe("legacy-application");
    expect((await adminApi.getTeacherOfferingCatalog()).tracks).toHaveLength(2);
    expect((await adminApi.reviewTeacherApplication("legacy-application", "approved")).status).toBe("approved");
    expect((await adminApi.listTeacherAccounts(listState, "active")).items[0]?.status).toBe(
      "active",
    );
    await adminApi.updateTeacherAccountStatus(
      "legacy-teacher",
      "suspended",
      "Repeated policy violations.",
    );
    const form = new FormData();
    form.set("name", "Salma Hassan");
    form.set("email", "salma@example.test");
    form.set("phone", "+201000000001");
    form.set("bio", "Updated bio");
    form.set(
      "offerings",
      JSON.stringify([{ trackId: "legacy-track", subjectId: "legacy-subject" }]),
    );
    expect(
      (
        await adminApi.resubmitTeacherApplication(form, {
          id: "legacy-teacher",
          name: "Salma Hassan",
          email: "salma@example.test",
        })
      ).id,
    ).toBe("legacy-application");
  } finally {
    nodeServer.resetHandlers();
    vi.unstubAllEnvs();
    vi.resetModules();
  }
});

it("preserves the live review conflict status", async () => {
  vi.stubEnv("VITE_API_MODE", "live"); vi.resetModules();
  nodeServer.use(
    http.patch(`${API_BASE_URL}/teachers/applications/:applicationId/review`, () =>
      HttpResponse.json({ error: { code: "ALREADY_REVIEWED", message: "Already reviewed" } }, { status: 409 }),
    ),
  );
  try {
    const api = await import("./admin");
    await expect(api.reviewTeacherApplication("application-1", "approved")).rejects.toMatchObject({ status: 409 });
  } finally {
    nodeServer.resetHandlers(); vi.unstubAllEnvs(); vi.resetModules();
  }
});

it("uses server pagination when normalizing a paginated academic list", async () => {
  vi.stubEnv("VITE_API_MODE", "live"); vi.stubEnv("VITE_ADMIN_ACADEMIC_ACCESS", "true"); vi.resetModules();
  const legacyTrack = { id: "legacy-track-page-two", system: "al_azhar", stage: "preparatory", grade: 2, name: "Second preparatory", isActive: true };
  nodeServer.use(http.get(`${API_BASE_URL}/academic/tracks`, () => HttpResponse.json({ data: [legacyTrack], pagination: { page: 2, limit: 2, total: 3 } })));
  try {
    const adminApi = await import("./admin");
    const result = await adminApi.listTracks({ ...defaultListState, page: 2, pageSize: 2 }, { active: "true" });
    expect(result).toMatchObject({ items: [expect.objectContaining({ id: "legacy-track-page-two" })], page: 2, pageSize: 2, total: 3 });
  } finally {
    nodeServer.resetHandlers(); vi.unstubAllEnvs(); vi.resetModules();
  }
});
