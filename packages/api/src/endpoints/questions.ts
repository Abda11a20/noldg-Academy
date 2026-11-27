import {
  QuestionInputSchema,
  QuestionListQuerySchema,
  QuestionListSchema,
  QuestionSchema,
  QuestionUpdateInputSchema,
  type QuestionInput,
  type QuestionListQuery,
  type QuestionUpdateInput,
} from "../contracts/assessments";
import { capabilities } from "../config/capabilities";
import { request } from "../http/client";
import { apiMode } from "../mocks/mode";
import { adaptLegacyQuestion, adaptQuestionList } from "../adapters/assessments";
import { requireCapability, signalOption, unknownResponseSchema } from "./catalog/common";

function extractData(payload: unknown): unknown {
  if (typeof payload !== "object" || payload === null || !("data" in payload)) return payload;
  return payload.data;
}

function legacyQuestionBody(input: QuestionUpdateInput): Record<string, unknown> {
  return {
    ...(input.text === undefined ? {} : { text: input.text }),
    type: "single_choice",
    ...(input.options === undefined ? {} : { options: input.options.map(({ text }) => text) }),
    ...(input.correctIndex === undefined ? {} : { correctAnswer: input.correctIndex }),
  };
}

function queryString(query: QuestionListQuery, live: boolean): string {
  const params = new URLSearchParams({
    page: String(query.page),
    [live ? "limit" : "pageSize"]: String(query.pageSize),
  });
  if (!live) {
    if (query.subjectId) params.set("subjectId", query.subjectId);
    if (query.lessonId) params.set("lessonId", query.lessonId);
    if (query.difficulty) params.set("difficulty", query.difficulty);
    if (query.status) params.set("status", query.status);
    if (query.search) params.set("q", query.search);
    if (query.courseId) params.set("courseId", query.courseId);
  }
  return `?${params.toString()}`;
}

/** Lists the teacher's questions using target filters or the legacy paginated response.
 * @param query Validated question list state.
 * @param signal Optional request cancellation signal.
 */
export async function listQuestions(query: QuestionListQuery, signal?: AbortSignal) {
  const values = QuestionListQuerySchema.parse(query);
  const payload = await request(
    `questions/my${queryString(values, apiMode === "live")}`,
    unknownResponseSchema,
    signalOption(signal),
  );
  return apiMode === "live"
    ? adaptQuestionList(payload)
    : QuestionListSchema.parse(extractData(payload));
}

/** Gets one question and preserves unsupported legacy entries as read-only data.
 * @param questionId Question identifier.
 * @param signal Optional request cancellation signal.
 */
export async function getQuestion(questionId: string, signal?: AbortSignal) {
  const payload = await request(
    `questions/${encodeURIComponent(questionId)}`,
    unknownResponseSchema,
    signalOption(signal),
  );
  return apiMode === "live"
    ? adaptLegacyQuestion(extractData(payload))
    : QuestionSchema.parse(extractData(payload));
}

/** Creates a target MCQ while dropping fields unsupported by the current live API.
 * @param input Validated target question fields.
 */
export async function createQuestion(input: QuestionInput) {
  const values = QuestionInputSchema.parse(input);
  const payload = await request("questions", unknownResponseSchema, {
    method: "POST",
    body: apiMode === "live" ? legacyQuestionBody(values) : values,
  });
  return apiMode === "live"
    ? adaptLegacyQuestion(extractData(payload))
    : QuestionSchema.parse(extractData(payload));
}

/** Updates a target question; live mode sends only legacy-supported MCQ fields.
 * @param questionId Question identifier.
 * @param input Partial validated question changes.
 */
export async function updateQuestion(questionId: string, input: Partial<QuestionInput>) {
  const values = QuestionUpdateInputSchema.parse(input);
  const payload = await request(
    `questions/${encodeURIComponent(questionId)}`,
    unknownResponseSchema,
    {
      method: "PATCH",
      body: apiMode === "live" ? legacyQuestionBody(values) : values,
    },
  );
  return apiMode === "live"
    ? adaptLegacyQuestion(extractData(payload))
    : QuestionSchema.parse(extractData(payload));
}

async function changeQuestionArchive(questionId: string, action: "archive" | "restore") {
  requireCapability(capabilities.questionArchive);
  const payload = await request(
    `questions/${encodeURIComponent(questionId)}/${action}`,
    unknownResponseSchema,
    {
      method: "POST",
    },
  );
  if (apiMode === "live") return adaptLegacyQuestion(extractData(payload));
  return QuestionSchema.parse(extractData(payload));
}

/** Archives a question without deleting historical assessment snapshots.
 * @param questionId Question identifier.
 */
export function archiveQuestion(questionId: string) {
  return changeQuestionArchive(questionId, "archive");
}

/** Restores a previously archived question.
 * @param questionId Question identifier.
 */
export function restoreQuestion(questionId: string) {
  return changeQuestionArchive(questionId, "restore");
}
