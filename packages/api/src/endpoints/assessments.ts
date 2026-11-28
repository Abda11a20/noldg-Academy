import { AppError } from "../errors/app-error";
import { capabilities } from "../config/capabilities";
import {
  AssessmentAttemptDetailSchema,
  AssessmentAttemptListSchema,
  AssessmentInputSchema,
  AssessmentListQuerySchema,
  AssessmentListSchema,
  AssessmentSchema,
  AssessmentUpdateInputSchema,
  type AssessmentInput,
  type AssessmentListQuery,
  type AssessmentUpdateInput,
} from "../contracts/assessments";
import {
  adaptAssessment,
  adaptAssessmentAttemptDetail,
  adaptAssessmentAttempts,
  adaptAssessmentList,
} from "../adapters/assessments";
import { request } from "../http/client";
import { apiMode } from "../mocks/mode";
import { signalOption, unknownResponseSchema } from "./catalog/common";

function extractData(payload: unknown): unknown {
  if (typeof payload !== "object" || payload === null || !("data" in payload)) return payload;
  return payload.data;
}

function unavailable(): AppError {
  return new AppError({
    code: "CAPABILITY_UNAVAILABLE",
    status: 501,
    message_key: "errors:capabilityUnavailable",
  });
}

function queryString(query: AssessmentListQuery, legacy: boolean): string {
  const params = new URLSearchParams({
    page: String(query.page),
    [legacy ? "limit" : "pageSize"]: String(query.pageSize),
  });
  if (query.courseId) params.set("courseId", query.courseId);
  if (query.lessonId) params.set("lessonId", query.lessonId);
  if (query.type) params.set("type", query.type);
  if (query.status) params.set("status", query.status);
  if (query.search) params.set("q", query.search);
  return `?${params.toString()}`;
}

/** Lists teacher assessments, adapting the backend's page/limit envelope in live mode.
 * @param query Validated course, type, status, and paging filters.
 * @param signal Optional cancellation signal.
 */
export async function listAssessments(query: AssessmentListQuery, signal?: AbortSignal) {
  const values = AssessmentListQuerySchema.parse(query);
  const payload = await request(
    `assessments/my${queryString(values, apiMode === "live")}`,
    unknownResponseSchema,
    signalOption(signal),
  );
  return apiMode === "live" ? adaptAssessmentList(payload) : AssessmentListSchema.parse(payload);
}

/** Lists assessments for one teacher-owned course.
 * @param courseId Course identifier.
 * @param signal Optional cancellation signal.
 */
export async function listCourseAssessments(courseId: string, signal?: AbortSignal) {
  const payload = await request(
    `assessments/courses/${encodeURIComponent(courseId)}`,
    unknownResponseSchema,
    signalOption(signal),
  );
  return apiMode === "live" ? adaptAssessmentList(payload) : AssessmentListSchema.parse(payload);
}

/** Loads one assessment, normalizing its legacy course and window fields.
 * @param assessmentId Assessment identifier.
 * @param signal Optional cancellation signal.
 */
export async function getAssessment(assessmentId: string, signal?: AbortSignal) {
  const payload = await request(
    `assessments/${encodeURIComponent(assessmentId)}`,
    unknownResponseSchema,
    signalOption(signal),
  );
  const data = extractData(payload);
  return apiMode === "live" ? adaptAssessment(data) : AssessmentSchema.parse(data);
}

/** Creates a target draft in mock mode; live creation is disabled because legacy requires an unspecified point weight per question.
 * @param input Validated target assessment input.
 */
export async function createAssessment(input: AssessmentInput) {
  const values = AssessmentInputSchema.parse(input);
  if (apiMode === "live") throw unavailable();
  const payload = await request("assessments", unknownResponseSchema, {
    method: "POST",
    body: values,
  });
  return AssessmentSchema.parse(extractData(payload));
}

/** Updates a draft assessment using target fields.
 * @param assessmentId Assessment identifier.
 * @param input Partial validated target changes.
 */
export async function updateAssessment(assessmentId: string, input: AssessmentUpdateInput) {
  const values = AssessmentUpdateInputSchema.parse(input);
  if (apiMode === "live") throw unavailable();
  const payload = await request(
    `assessments/${encodeURIComponent(assessmentId)}`,
    unknownResponseSchema,
    {
      method: "PATCH",
      body: values,
    },
  );
  return AssessmentSchema.parse(extractData(payload));
}

async function changeAssessmentStatus(assessmentId: string, action: "publish" | "close") {
  const payload = await request(
    `assessments/${encodeURIComponent(assessmentId)}/${action}`,
    unknownResponseSchema,
    { method: "PATCH" },
  );
  const data = extractData(payload);
  return apiMode === "live" ? adaptAssessment(data) : AssessmentSchema.parse(data);
}

/** Publishes an assessment; backend validation remains authoritative.
 * @param assessmentId Assessment identifier.
 */
export function publishAssessment(assessmentId: string) {
  return changeAssessmentStatus(assessmentId, "publish");
}

/** Closes a published assessment.
 * @param assessmentId Assessment identifier.
 */
export function closeAssessment(assessmentId: string) {
  return changeAssessmentStatus(assessmentId, "close");
}

/** Archives an assessment when the target archive capability is available.
 * @param assessmentId Assessment identifier.
 */
export async function archiveAssessment(assessmentId: string) {
  if (apiMode === "live") throw unavailable();
  const payload = await request(
    `assessments/${encodeURIComponent(assessmentId)}/archive`,
    unknownResponseSchema,
    { method: "PATCH" },
  );
  return AssessmentSchema.parse(extractData(payload));
}

/** Lists server-computed teacher attempt results.
 * @param assessmentId Assessment identifier.
 * @param query Page and optional result filters.
 * @param signal Optional cancellation signal.
 */
export async function listAssessmentAttempts(
  assessmentId: string,
  query: { page: number; pageSize: number; search?: string; suspicious?: boolean },
  signal?: AbortSignal,
) {
  if (apiMode === "live" && !capabilities.assessmentResultsApi) throw unavailable();
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.search) params.set("q", query.search);
  if (query.suspicious !== undefined) params.set("suspicious", String(query.suspicious));
  const payload = await request(
    `assessments/${encodeURIComponent(assessmentId)}/attempts?${params.toString()}`,
    unknownResponseSchema,
    signalOption(signal),
  );
  return apiMode === "live"
    ? adaptAssessmentAttempts(payload)
    : AssessmentAttemptListSchema.parse(extractData(payload));
}

/** Loads one server-computed frozen attempt detail.
 * @param assessmentId Assessment identifier.
 * @param attemptId Attempt identifier.
 * @param signal Optional cancellation signal.
 */
export async function getAssessmentAttempt(
  assessmentId: string,
  attemptId: string,
  signal?: AbortSignal,
) {
  if (apiMode === "live" && !capabilities.assessmentResultsApi) throw unavailable();
  const payload = await request(
    `assessments/${encodeURIComponent(assessmentId)}/attempts/${encodeURIComponent(attemptId)}`,
    unknownResponseSchema,
    signalOption(signal),
  );
  const data = extractData(payload);
  return apiMode === "live"
    ? adaptAssessmentAttemptDetail(data)
    : AssessmentAttemptDetailSchema.parse(data);
}
