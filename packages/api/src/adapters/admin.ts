import {
  AcademicSubjectSchema,
  AcademicTrackSchema,
  TeacherApplicationSchema,
  type AcademicSubject,
  type AcademicTrack,
  type AcademicSystem,
  type AcademicStage,
  type TeacherApplication,
} from "../contracts/admin";

const legacySystems: Record<string, AcademicSystem> = {
  al_azhar: "azhar",
  egyptian_baccalaureate: "egyptian_bacc",
  general: "general",
  languages: "languages",
  american_diploma: "american_diploma",
};
const legacyStages: Record<string, AcademicStage> = { preparatory: "prep", secondary: "secondary" };

function unwrapData(value: unknown): unknown {
  if (!value || typeof value !== "object" || !("data" in value)) return value;
  return value.data;
}

/** Maps one legacy academic track to the target contract without changing UI code.
 * @param value Current backend or target track value.
 * @returns Validated target track.
 */
export function adaptAcademicTrack(value: unknown, mode: "mock" | "live" = "mock"): AcademicTrack {
  if (mode === "mock") return AcademicTrackSchema.parse(value);
  const record = value as Record<string, unknown>;
  return AcademicTrackSchema.parse({
    ...record,
    system: legacySystems[String(record.system)],
    stage: legacyStages[String(record.stage)],
    active: record.isActive,
  });
}

/** Maps a legacy academic subject to the target contract.
 * @param value Current backend or target subject value.
 * @returns Validated target subject.
 */
export function adaptAcademicSubject(
  value: unknown,
  mode: "mock" | "live" = "mock",
): AcademicSubject {
  if (mode === "mock") return AcademicSubjectSchema.parse(value);
  const record = value as Record<string, unknown>;
  return AcademicSubjectSchema.parse({ ...record, active: record.isActive });
}

function nestedRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
}

function mapLegacyOffering(entry: unknown) {
  const offering = entry as Record<string, unknown>;
  const track = nestedRecord(offering.trackId);
  const subject = nestedRecord(offering.subjectId);
  return {
    trackId: String(track?.id ?? offering.trackId),
    subjectId: String(subject?.id ?? offering.subjectId),
    ...(track ? { track: adaptAcademicTrack(track, "live") } : {}),
    ...(subject ? { subject: adaptAcademicSubject(subject, "live") } : {}),
  };
}

function applicationOwner(
  profile: Record<string, unknown>,
  fallback?: { id: string; name: string; email: string },
): Record<string, unknown> {
  const owner = nestedRecord(profile.userId) ?? fallback;
  if (!owner)
    throw new Error("Teacher profile owner is required to normalize the current response.");
  return owner;
}

function applicationOfferings(profile: Record<string, unknown>) {
  return Array.isArray(profile.offerings) ? profile.offerings.map(mapLegacyOffering) : [];
}

function normalizeLegacyApplication(
  value: unknown,
  fallback?: { id: string; name: string; email: string },
) {
  const profile = value as Record<string, unknown>;
  const user = applicationOwner(profile, fallback);
  const profileImage = nestedRecord(profile.profileImage);
  const phone = typeof user.phone === "string" ? user.phone : "";
  return {
    id: profile.id,
    userId: { id: user.id, name: user.name, email: user.email, phone },
    name: user.name,
    email: user.email,
    phone,
    bio: profile.bio ?? "",
    ...(typeof profileImage?.url === "string" ? { imageUrl: profileImage.url } : {}),
    status: profile.approvalStatus,
    rejectionReason: profile.rejectionReason,
    submittedAt: profile.createdAt,
    reviewedAt: profile.reviewedAt,
    offerings: applicationOfferings(profile),
  };
}

/** Maps current teacher profile fields into the target application contract.
 * @param value Current backend or target profile value.
 * @returns Validated target application.
 */
export function adaptTeacherApplication(
  value: unknown,
  mode: "mock" | "live" = "mock",
  owner?: { id: string; name: string; email: string },
): TeacherApplication {
  if (mode === "mock") return TeacherApplicationSchema.parse(value);
  return TeacherApplicationSchema.parse(normalizeLegacyApplication(value, owner));
}

/** Extracts response data for endpoints whose backend wraps values in `{ data }`.
 * @param value Raw response payload.
 * @returns Inner data payload when present.
 */
export function unwrapAdminData(value: unknown): unknown {
  return unwrapData(value);
}
