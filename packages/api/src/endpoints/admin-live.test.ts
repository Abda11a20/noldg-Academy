import { expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { API_BASE_URL } from "../constants/http";
import { nodeServer } from "../mocks/node";

const defaultListState = { page: 1, pageSize: 10, search: "", filters: {} };

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
      expect(((await request.json()) as Record<string, unknown>).isActive).toBe(false);
      return HttpResponse.json({ data: { ...legacyTrack, isActive: false } });
    }),
    http.get(`${API_BASE_URL}/academic/subjects`, () =>
      HttpResponse.json({ data: [legacySubject] }),
    ),
    http.post(`${API_BASE_URL}/academic/subjects`, () =>
      HttpResponse.json({ data: legacySubject }),
    ),
    http.patch(`${API_BASE_URL}/academic/subjects/:subjectId`, () =>
      HttpResponse.json({ data: { ...legacySubject, isActive: false } }),
    ),
    http.get(`${API_BASE_URL}/academic/tracks/:trackId/subjects`, () =>
      HttpResponse.json({ data: [legacySubject] }),
    ),
    http.post(`${API_BASE_URL}/academic/tracks/:trackId/subjects`, () =>
      HttpResponse.json({ success: true }),
    ),
    http.delete(`${API_BASE_URL}/academic/tracks/:trackId/subjects/:subjectId`, () =>
      HttpResponse.json({ success: true }),
    ),
    http.get(`${API_BASE_URL}/teachers/applications`, ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get("page") ?? 1);
      const matchesStatus = url.searchParams.get("status") === applicationStatus;
      const pageItems = matchesStatus
        ? [
            {
              ...legacyApplication,
              id: page === 1 ? "other-application" : legacyApplication.id,
              approvalStatus: applicationStatus,
            },
          ]
        : [];
      return HttpResponse.json({
        data: pageItems,
        pagination: { page, limit: 1, total: matchesStatus ? 2 : 0 },
      });
    }),
    http.get(`${API_BASE_URL}/teachers/me/application`, () =>
      HttpResponse.json({ data: legacyApplication }),
    ),
    http.get(`${API_BASE_URL}/academic/catalog`, () => HttpResponse.json({ data: [] })),
    http.patch(
      `${API_BASE_URL}/teachers/applications/:applicationId/review`,
      async ({ request }) => {
        const body = (await request.json()) as { status: string };
        applicationStatus = body.status;
        return HttpResponse.json({
          data: {
            ...legacyApplication,
            userId: "legacy-teacher",
            approvalStatus: body.status,
            offerings: [{ trackId: "legacy-track", subjectId: "legacy-subject" }],
          },
        });
      },
    ),
    http.get(`${API_BASE_URL}/users`, () =>
      HttpResponse.json({
        data: [
          {
            id: "legacy-teacher",
            name: "Salma Hassan",
            email: "salma@example.test",
            status: "ACTIVE",
          },
        ],
        pagination: { page: 1, limit: 10, total: 1 },
      }),
    ),
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
      "legacy-application",
      2,
      2,
      3,
    ]);
    nodeServer.resetHandlers();
    installLegacyAdminHandlers(legacyTrack, legacySubject, legacyApplication);
    expect((await adminApi.getTeacherApplication("legacy-application")).id).toBe(
      "legacy-application",
    );
    await expect(adminApi.getTeacherApplication("missing-application")).rejects.toMatchObject({
      status: 404,
    });
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
    expect((await adminApi.reviewTeacherApplication("legacy-application", "approved")).status).toBe(
      "approved",
    );
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
