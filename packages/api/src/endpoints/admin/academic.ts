import { z } from "zod";
import { AppError } from "../../errors/app-error";
import { apiMode } from "../../mocks/mode";
import { capabilities } from "../../config/capabilities";
import { request } from "../../http/client";
import { adaptAcademicSubject, adaptAcademicTrack, unwrapAdminData } from "../../adapters/admin";
import {
  AcademicSubjectSchema,
  AcademicTrackSchema,
  SubjectInputSchema,
  SubjectListSchema,
  SubjectUpdateSchema,
  TrackInputSchema,
  TrackListSchema,
  TrackUpdateSchema,
  type AcademicSubject,
  type AcademicTrack,
} from "../../contracts/admin";
import type { ListUrlState } from "../../contracts/common";
import { legacyStages, legacySystems, listPath, parseTargetList } from "./common";

const dataSchema = z.unknown();

function requireAcademicAccess(): void {
  if (apiMode === "mock" || capabilities.adminAcademicAccess) return;
  throw new AppError({
    code: "FORBIDDEN",
    status: 403,
    message_key: "errors:forbidden",
  });
}

/** Lists academic tracks with target pagination and legacy field adaptation.
 * @param state Validated URL list state.
 * @param filters Active system, stage, and status filters.
 * @returns Normalized track page.
 */
export async function listTracks(state: ListUrlState, filters: Record<string, string> = {}) {
  requireAcademicAccess();
  const { active, ...trackFilters } = filters;
  const baseFilters = {
    ...trackFilters,
    ...(active ? { [apiMode === "mock" ? "active" : "isActive"]: active } : {}),
  };
  if (apiMode === "live" && !active) {
    const [activePayload, inactivePayload] = await Promise.all([
      request(
        listPath("academic/tracks", state, { ...baseFilters, isActive: "true" }, false, false),
        dataSchema,
      ),
      request(
        listPath("academic/tracks", state, { ...baseFilters, isActive: "false" }, false, false),
        dataSchema,
      ),
    ]);
    const records = [activePayload, inactivePayload]
      .flatMap((payload) => {
        const data = unwrapAdminData(payload);
        return Array.isArray(data) ? data.map((value) => adaptAcademicTrack(value, apiMode)) : [];
      })
      .filter(
        (track) =>
          !state.search ||
          track.name.toLocaleLowerCase().includes(state.search.toLocaleLowerCase()),
      );
    const start = (state.page - 1) * state.pageSize;
    return TrackListSchema.parse({
      items: records.slice(start, start + state.pageSize),
      page: state.page,
      pageSize: state.pageSize,
      total: records.length,
    });
  }
  const payload = await request(
    listPath("academic/tracks", state, baseFilters, apiMode === "mock", apiMode === "mock"),
    dataSchema,
  );
  return TrackListSchema.parse(
    parseTargetList(payload, (value) => adaptAcademicTrack(value, apiMode), state),
  );
}

/** Creates an academic track in mock or legacy live mode.
 * @param input Validated target track fields.
 * @returns Created target track.
 */
export async function createTrack(
  input: Pick<AcademicTrack, "system" | "stage" | "grade" | "name">,
) {
  requireAcademicAccess();
  const values = TrackInputSchema.parse(input);
  const body =
    apiMode === "mock"
      ? values
      : {
          ...values,
          system: legacySystems[values.system] ?? values.system,
          stage: legacyStages[values.stage] ?? values.stage,
        };
  const payload = await request("academic/tracks", dataSchema, { method: "POST", body });
  return AcademicTrackSchema.parse(adaptAcademicTrack(unwrapAdminData(payload), apiMode));
}

/** Updates a track and maps target `active` to the legacy `isActive` property.
 * @param trackId Track identifier.
 * @param input Partial target changes.
 * @returns Updated track.
 */
export async function updateTrack(trackId: string, input: Partial<AcademicTrack>) {
  requireAcademicAccess();
  const values = TrackUpdateSchema.parse(input);
  const body =
    apiMode === "mock"
      ? values
      : {
          ...(values.name ? { name: values.name } : {}),
          ...(values.active !== undefined ? { isActive: values.active } : {}),
        };
  const payload = await request(`academic/tracks/${trackId}`, dataSchema, {
    method: "PATCH",
    body,
  });
  return AcademicTrackSchema.parse(adaptAcademicTrack(unwrapAdminData(payload), apiMode));
}

/** Lists subjects in a target page, adapting the current backend envelope.
 * @param state Validated URL list state.
 * @returns Normalized subject page.
 */
export async function listSubjects(state: ListUrlState) {
  requireAcademicAccess();
  const filters = state.filters.active
    ? { [apiMode === "mock" ? "active" : "isActive"]: state.filters.active }
    : {};
  if (apiMode === "live" && !state.filters.active) {
    const [activePayload, inactivePayload] = await Promise.all([
      request(listPath("academic/subjects", state, { isActive: "true" }, false, false), dataSchema),
      request(
        listPath("academic/subjects", state, { isActive: "false" }, false, false),
        dataSchema,
      ),
    ]);
    const records = [activePayload, inactivePayload]
      .flatMap((payload) => {
        const data = unwrapAdminData(payload);
        return Array.isArray(data) ? data.map((value) => adaptAcademicSubject(value, apiMode)) : [];
      })
      .filter(
        (subject) =>
          !state.search ||
          subject.name.toLocaleLowerCase().includes(state.search.toLocaleLowerCase()),
      );
    const start = (state.page - 1) * state.pageSize;
    return SubjectListSchema.parse({
      items: records.slice(start, start + state.pageSize),
      page: state.page,
      pageSize: state.pageSize,
      total: records.length,
    });
  }
  const payload = await request(
    listPath("academic/subjects", state, filters, apiMode === "mock", apiMode === "mock"),
    dataSchema,
  );
  return SubjectListSchema.parse(
    parseTargetList(payload, (value) => adaptAcademicSubject(value, apiMode), state),
  );
}

/** Creates an academic subject.
 * @param name Subject display name.
 * @returns Created subject.
 */
export async function createSubject(name: string) {
  requireAcademicAccess();
  const values = SubjectInputSchema.parse({ name });
  const payload = await request("academic/subjects", dataSchema, { method: "POST", body: values });
  return apiMode === "mock"
    ? AcademicSubjectSchema.parse(payload)
    : adaptAcademicSubject(unwrapAdminData(payload), apiMode);
}

/** Updates a subject's name or active state.
 * @param subjectId Subject identifier.
 * @param fields Editable subject fields.
 * @returns Updated subject.
 */
export async function updateSubject(subjectId: string, fields: Partial<AcademicSubject>) {
  requireAcademicAccess();
  const values = SubjectUpdateSchema.parse(fields);
  const body =
    apiMode === "mock"
      ? values
      : {
          ...(values.name ? { name: values.name } : {}),
          ...(values.active !== undefined ? { isActive: values.active } : {}),
        };
  const payload = await request(`academic/subjects/${subjectId}`, dataSchema, {
    method: "PATCH",
    body,
  });
  return apiMode === "mock"
    ? AcademicSubjectSchema.parse(payload)
    : adaptAcademicSubject(unwrapAdminData(payload), apiMode);
}

/** Reads subjects mapped to an academic track.
 * @param trackId Track identifier.
 * @returns Mapped subjects.
 */
export async function listTrackSubjects(trackId: string) {
  requireAcademicAccess();
  const payload = await request(`academic/tracks/${trackId}/subjects`, dataSchema);
  const data = unwrapAdminData(payload);
  return z
    .array(AcademicSubjectSchema)
    .parse(Array.isArray(data) ? data.map((value) => adaptAcademicSubject(value, apiMode)) : []);
}

/** Adds a subject to a track without replacing other mappings.
 * @param trackId Track identifier.
 * @param subjectId Subject identifier.
 * @returns Resolves after the mapping is created.
 */
export async function addTrackSubject(trackId: string, subjectId: string): Promise<void> {
  requireAcademicAccess();
  await request(`academic/tracks/${trackId}/subjects`, z.unknown(), {
    method: "POST",
    body: { subjectId },
  });
}

/** Removes only the mapping between a track and a subject.
 * @param trackId Track identifier.
 * @param subjectId Subject identifier.
 * @returns Resolves after unlinking.
 */
export async function removeTrackSubject(trackId: string, subjectId: string): Promise<void> {
  requireAcademicAccess();
  await request(`academic/tracks/${trackId}/subjects/${subjectId}`, z.unknown(), {
    method: "DELETE",
  });
}
