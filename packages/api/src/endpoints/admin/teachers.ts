import { z } from "zod";
import { AppError } from "../../errors/app-error";
import { apiMode } from "../../mocks/mode";
import { request } from "../../http/client";
import { capabilities } from "../../config/capabilities";
import { adaptTeacherApplication, unwrapAdminData } from "../../adapters/admin";
import {
  TeacherApplicationListSchema,
  TeacherApplicationSchema,
  TeacherResubmissionSchema,
  TeacherReviewSchema,
  UserListSchema,
  type TeacherApplication,
} from "../../contracts/admin";
import { AcademicCatalogSchema, type AcademicCatalog, type AuthUser } from "../../contracts/auth";
import type { ListUrlState } from "../../contracts/common";
import { listPath, requireCapability } from "./common";
import { listTrackSubjects, listTracks } from "./academic";

const dataSchema = z.unknown();
const LIVE_APPLICATION_PAGE_SIZE = 100;

async function findLiveApplication(
  applicationId: string,
  statuses: readonly ("pending" | "rejected" | "approved")[],
): Promise<TeacherApplication> {
  for (const status of statuses) {
    for (let page = 1; ; page += 1) {
      const payload = await request(
        listPath(
          "teachers/applications",
          {
            page,
            pageSize: LIVE_APPLICATION_PAGE_SIZE,
            search: "",
            filters: {},
          },
          { status },
          true,
          false,
        ),
        dataSchema,
      );
      const raw = payload as {
        data: unknown[];
        pagination: { page: number; limit: number; total: number };
      };
      const items = raw.data.map((value) => adaptTeacherApplication(value, "live"));
      const match = items.find((item) => item.id === applicationId);
      if (match) return match;
      if (items.length === 0 || raw.pagination.page * raw.pagination.limit >= raw.pagination.total)
        break;
      page = raw.pagination.page;
    }
  }
  throw new AppError({ code: "NOT_FOUND", status: 404, message_key: "errors:requestFailed" });
}

/** Lists teacher applications, mapping backend pagination and profile fields.
 * @param state Validated URL state.
 * @param status Application status filter.
 * @returns Normalized application page.
 */
export async function listTeacherApplications(state: ListUrlState, status: string) {
  const payload = await request(
    listPath("teachers/applications", state, { status }, true, apiMode === "mock"),
    dataSchema,
  );
  const raw = payload as {
    data?: unknown;
    pagination?: { page?: number; limit?: number; total?: number };
  };
  if (apiMode === "mock") return TeacherApplicationListSchema.parse(payload);
  const items = Array.isArray(raw.data)
    ? raw.data.map((value) => adaptTeacherApplication(value, apiMode))
    : [];
  const pagination = raw.pagination;
  return TeacherApplicationListSchema.parse({
    items,
    page: pagination?.page ?? state.page,
    pageSize: pagination?.limit ?? state.pageSize,
    total: pagination?.total ?? items.length,
  });
}

/** Loads a teacher application's details from the current application list because legacy API lacks a detail route.
 * @param applicationId Application identifier.
 * @returns Application if available from the list response.
 */
export async function getTeacherApplication(applicationId: string): Promise<TeacherApplication> {
  if (apiMode === "mock") {
    const payload = await request(
      `teachers/applications/${encodeURIComponent(applicationId)}`,
      dataSchema,
    );
    return TeacherApplicationSchema.parse(payload);
  }
  return findLiveApplication(applicationId, ["pending", "rejected", "approved"]);
}

/** Loads the current teacher's submitted application profile.
 * @param owner Authenticated user summary used to enrich the legacy profile response.
 * @returns Normalized application details.
 */
export async function getMyTeacherApplication(
  owner: Pick<AuthUser, "id" | "name" | "email">,
): Promise<TeacherApplication> {
  const payload = await request("teachers/me/application", dataSchema);
  return adaptTeacherApplication(unwrapAdminData(payload), apiMode, owner);
}

/** Loads tracks and their subjects for a signed-in teacher's offering editor.
 * @returns Catalog adapted from the authenticated legacy catalog endpoint.
 */
export async function getTeacherOfferingCatalog(): Promise<AcademicCatalog> {
  if (apiMode === "mock") return request("academic/catalog", AcademicCatalogSchema);
  const state: ListUrlState = { page: 1, pageSize: 100, search: "", filters: {} };
  const trackPage = await listTracks(state);
  const tracks = await Promise.all(
    trackPage.items.map(async (track) => ({
      id: track.id,
      name: track.name,
      system: track.system,
      stage: track.stage,
      grade: track.grade,
      subjects: await listTrackSubjects(track.id),
    })),
  );
  return AcademicCatalogSchema.parse({
    systems: [...new Set(tracks.map((track) => track.system))],
    tracks,
  });
}

/** Approves or rejects an application, dropping unsupported live rejection reasons.
 * @param id Application identifier.
 * @param status Decision status.
 * @param reason Optional required target rejection reason.
 * @returns Updated application.
 */
export async function reviewTeacherApplication(
  id: string,
  status: "approved" | "rejected",
  reason?: string,
) {
  const decision = TeacherReviewSchema.parse(
    status === "rejected" ? { status, reason } : { status },
  );
  const action = status === "approved" ? "approve" : "reject";
  const encodedId = encodeURIComponent(id);
  const path =
    apiMode === "mock"
      ? `teachers/applications/${encodedId}/${action}`
      : `teachers/applications/${encodedId}/review`;
  const body = apiMode === "mock" ? decision : { status };
  const payload = await request(path, dataSchema, {
    method: apiMode === "mock" ? "POST" : "PATCH",
    body,
  });
  return apiMode === "mock"
    ? adaptTeacherApplication(unwrapAdminData(payload), apiMode)
    : findLiveApplication(id, [status]);
}

/** Lists user accounts using target list params and current page/limit response.
 * @param state Validated URL list state.
 * @param status Account status filter.
 * @returns Normalized user page.
 */
export async function listTeacherAccounts(state: ListUrlState, status: "active" | "suspended") {
  requireCapability(capabilities.adminSearchAndPagination);
  const payload = await request(
    listPath("users", state, { status, role: "teacher" }, true, false),
    dataSchema,
  );
  if (apiMode === "mock") return UserListSchema.parse(payload);
  const record = payload as {
    data?: Array<Record<string, unknown>>;
    pagination?: { page?: number; limit?: number; total?: number };
  };
  const page = record.pagination?.page ?? state.page;
  const pageSize = record.pagination?.limit ?? state.pageSize;
  const items = (record.data ?? []).map((item) => ({
    id: String(item.id),
    name: String(item.name),
    email: String(item.email),
    role: "teacher",
    status: String(item.status).toLowerCase(),
  }));
  return UserListSchema.parse({
    items,
    page,
    pageSize,
    total: record.pagination?.total ?? items.length,
  });
}

/** Changes a teacher account status; the legacy API does not accept a reason.
 * @param userId Account identifier.
 * @param status Desired account state.
 * @param reason Target audit reason, retained in mock mode only.
 * @returns Resolves after the update.
 */
export async function updateTeacherAccountStatus(
  userId: string,
  status: "active" | "suspended",
  reason?: string,
): Promise<void> {
  requireCapability(apiMode === "mock" || capabilities.adminAcademicAccess);
  await request(`users/${encodeURIComponent(userId)}/status`, z.unknown(), {
    method: "PATCH",
    body: apiMode === "mock" ? { status, reason } : { status },
  });
}

/** Resubmits a rejected teacher application using the multipart profile contract.
 * @param body FormData with profile fields and offering JSON.
 * @returns Validated updated application.
 */
export async function resubmitTeacherApplication(
  body: FormData,
  owner: Pick<AuthUser, "id" | "name" | "email">,
) {
  const offerings = body.get("offerings");
  const offeringValues = typeof offerings === "string" ? (JSON.parse(offerings) as unknown) : [];
  const values = TeacherResubmissionSchema.parse({
    name: body.get("name"),
    email: body.get("email"),
    phone: body.get("phone"),
    bio: body.get("bio"),
    offerings: offeringValues,
  });
  let requestBody = body;
  if (apiMode === "live") {
    requestBody = new FormData();
    requestBody.set("bio", values.bio);
    requestBody.set("offerings", JSON.stringify(values.offerings));
    const image = body.get("image");
    if (image instanceof File) requestBody.set("image", image);
  }
  const payload = await request(
    apiMode === "mock" ? "teachers/me/application" : "teachers/applications",
    dataSchema,
    { method: apiMode === "mock" ? "PUT" : "POST", body: requestBody },
  );
  return adaptTeacherApplication(unwrapAdminData(payload), apiMode, owner);
}
