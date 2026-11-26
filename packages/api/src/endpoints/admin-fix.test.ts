import { expect, it, vi } from "vitest";
import { z } from "zod";
import { request } from "../http/client";
import { reviewTeacherApplication, resubmitTeacherApplication } from "./admin";

it("preserves rejection history when a teacher resubmits", async () => {
  const rejectionReason = "Please add more teaching details";
  await reviewTeacherApplication("application-1", "rejected", rejectionReason);
  const body = new FormData();
  body.set("name", "Salma Hassan");
  body.set("email", "teacher-pending@example.test");
  body.set("phone", "+201000000001");
  body.set("bio", "Updated teaching biography");
  body.set("offerings", JSON.stringify([{ trackId: "track-1", subjectId: "subject-1" }]));

  const application = await resubmitTeacherApplication(body, {
    id: "teacher-id",
    name: "Salma Hassan",
    email: "teacher-pending@example.test",
  });

  expect(application.status).toBe("pending");
  expect(application.rejectionReason).toBe(rejectionReason);
  expect(application.statusHistory).toContainEqual(
    expect.objectContaining({ status: "rejected", reason: rejectionReason }),
  );
});

it("covers invalid and missing administrative mock requests", async () => {
  const failures = [
    request("academic/tracks", z.unknown(), { method: "POST", body: {} }),
    request("academic/tracks/missing", z.unknown(), { method: "PATCH", body: {} }),
    request("academic/subjects", z.unknown(), { method: "POST", body: {} }),
    request("academic/subjects/missing", z.unknown(), { method: "PATCH", body: {} }),
    request("academic/tracks/missing/subjects", z.unknown(), {
      method: "POST",
      body: { subjectId: "missing" },
    }),
    request("teachers/applications/missing", z.unknown()),
    request("teachers/applications/missing/approve", z.unknown(), { method: "POST" }),
    request("teachers/applications/application-1/reject", z.unknown(), {
      method: "POST",
      body: {},
    }),
    request("users/missing/status", z.unknown(), { method: "PATCH", body: { status: "active" } }),
    request("users/teacher-id/status", z.unknown(), { method: "PATCH", body: {} }),
  ];
  const results = await Promise.allSettled(failures);
  expect(results.every((result) => result.status === "rejected")).toBe(true);
  await expect(request("academic/tracks?page=0&limit=0", z.unknown())).resolves.toMatchObject({
    page: 1,
    pageSize: 1,
  });
  await expect(request("teachers/applications?status=missing", z.unknown())).resolves.toMatchObject(
    {
      items: [],
      total: 0,
    },
  );
});

it("returns forbidden when the live academic access capability is disabled", async () => {
  vi.stubEnv("VITE_API_MODE", "live");
  vi.stubEnv("VITE_ADMIN_ACADEMIC_ACCESS", "false");
  vi.resetModules();
  try {
    const liveAdminApi = await import("./admin");
    await expect(
      liveAdminApi.listTracks({ page: 1, pageSize: 10, search: "", filters: {} }),
    ).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
  } finally {
    vi.unstubAllEnvs();
    vi.resetModules();
  }
});
