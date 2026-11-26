import { expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { API_BASE_URL } from "../constants/http";
import { nodeServer } from "../mocks/node";
import {
  addTrackSubject,
  createSubject,
  createTrack,
  getMyTeacherApplication,
  getTeacherApplication,
  getTeacherOfferingCatalog,
  listSubjects,
  listTeacherAccounts,
  listTeacherApplications,
  listTrackSubjects,
  listTracks,
  removeTrackSubject,
  resubmitTeacherApplication,
  reviewTeacherApplication,
  updateSubject,
  updateTeacherAccountStatus,
  updateTrack,
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

it("preserves the live review conflict status", async () => {
  vi.stubEnv("VITE_API_MODE", "live");
  vi.resetModules();
  nodeServer.use(
    http.patch(`${API_BASE_URL}/teachers/applications/:applicationId/review`, () =>
      HttpResponse.json(
        { error: { code: "ALREADY_REVIEWED", message: "Already reviewed" } },
        { status: 409 },
      ),
    ),
  );
  try {
    const api = await import("./admin");
    await expect(api.reviewTeacherApplication("application-1", "approved")).rejects.toMatchObject({
      status: 409,
    });
  } finally {
    nodeServer.resetHandlers();
    vi.unstubAllEnvs();
    vi.resetModules();
  }
});

it("uses server pagination when normalizing a paginated academic list", async () => {
  vi.stubEnv("VITE_API_MODE", "live");
  vi.stubEnv("VITE_ADMIN_ACADEMIC_ACCESS", "true");
  vi.resetModules();
  const legacyTrack = {
    id: "legacy-track-page-two",
    system: "al_azhar",
    stage: "preparatory",
    grade: 2,
    name: "Second preparatory",
    isActive: true,
  };
  nodeServer.use(
    http.get(`${API_BASE_URL}/academic/tracks`, () =>
      HttpResponse.json({ data: [legacyTrack], pagination: { page: 2, limit: 2, total: 3 } }),
    ),
  );
  try {
    const adminApi = await import("./admin");
    const result = await adminApi.listTracks(
      { ...defaultListState, page: 2, pageSize: 2 },
      { active: "true" },
    );
    expect(result).toMatchObject({
      items: [expect.objectContaining({ id: "legacy-track-page-two" })],
      page: 2,
      pageSize: 2,
      total: 3,
    });
  } finally {
    nodeServer.resetHandlers();
    vi.unstubAllEnvs();
    vi.resetModules();
  }
});
