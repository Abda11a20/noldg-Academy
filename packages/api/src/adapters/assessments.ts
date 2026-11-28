import { z } from "zod";
import {
  AssessmentAttemptDetailSchema,
  AssessmentAttemptListSchema,
  AssessmentResultsSummarySchema,
  AssessmentListSchema,
  AssessmentSchema,
  QuestionEntrySchema,
  QuestionListSchema,
  type Assessment,
  type QuestionEntry,
} from "../contracts/assessments";
import { AppError } from "../errors/app-error";

const LegacyQuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  type: z.enum(["single_choice", "multiple_choice", "true_false", "essay"]),
  options: z.array(z.string()).optional(),
  correctAnswer: z.unknown().optional(),
});

function invalidResponse(): AppError {
  return new AppError({
    code: "RESPONSE_VALIDATION_FAILED",
    status: 502,
    message_key: "errors:invalidResponse",
  });
}

function unsupportedLegacyType(
  type: z.infer<typeof LegacyQuestionSchema>["type"],
): "multiple_choice" | "true_false" | "essay" {
  return type === "single_choice" ? "multiple_choice" : type;
}

/** Converts one verified legacy question to a target MCQ or a read-only unsupported entry.
 * @param value Current backend question payload.
 * @returns A supported single-answer MCQ or an explicit unsupported legacy item.
 */
export function adaptLegacyQuestion(value: unknown): QuestionEntry {
  const target = QuestionEntrySchema.safeParse(value);
  if (target.success) return target.data;
  const legacy = LegacyQuestionSchema.safeParse(value);
  if (!legacy.success) throw invalidResponse();
  const source = legacy.data;
  const options = source.options ?? [];
  if (source.type === "single_choice" && typeof source.correctAnswer === "number") {
    return QuestionEntrySchema.parse({
      id: source.id,
      type: "multiple_choice",
      text: source.text,
      options: options.map((text) => ({ text })),
      correctIndex: source.correctAnswer,
      status: "active",
    });
  }
  return QuestionEntrySchema.parse({
    id: source.id,
    text: source.text,
    legacyType: unsupportedLegacyType(source.type),
    options,
    ...(source.correctAnswer === undefined ? {} : { correctAnswer: source.correctAnswer }),
    supported: false,
  });
}

/** Normalizes target and current backend question list envelopes.
 * @param value Target or legacy list response.
 * @returns A target paginated list containing supported and unsupported entries.
 */
export function adaptQuestionList(value: unknown) {
  const target = QuestionListSchema.safeParse(value);
  if (target.success) return target.data;
  if (!isLegacyList(value)) throw invalidResponse();
  const source = value;
  if (!Array.isArray(source.data)) throw invalidResponse();
  const items = source.data.map(adaptLegacyQuestion);
  return QuestionListSchema.parse({
    items,
    ...legacyPagination(source.pagination, items.length),
  });
}

/** Normalizes a target assessment or the current assessment response.
 * @param value Target or legacy assessment payload.
 * @returns Assessment with unsupported legacy fields represented by safe defaults.
 */
export function adaptAssessment(value: unknown): Assessment {
  const target = AssessmentSchema.safeParse(value);
  if (target.success) return target.data;
  if (!isRecord(value)) throw invalidResponse();
  return normalizeLegacyAssessment(value);
}

function normalizeLegacyAssessment(value: Record<string, unknown>): Assessment {
  const rawType = value.type;
  if (rawType !== "quiz" && rawType !== "homework" && rawType !== "exam") throw invalidResponse();
  const legacy = {
    id: value.id,
    type: rawType,
    courseId: value.courseId,
    ...legacyLessonId(value),
    title: value.title,
    status: value.status,
    questionIds: legacyQuestionIds(value.questions),
    shuffle: true,
    showResults: "immediate" as const,
    targetMode: "all_course_students" as const,
    studentIds: [],
    ...legacySchedule(value),
    maxAttempts: value.maxAttempts,
    ...legacyWatchThreshold(value),
    attemptCount: legacyAttemptCount(value),
  };
  const parsed = AssessmentSchema.safeParse(legacy);
  if (!parsed.success)
    throw new AppError({
      code: "RESPONSE_VALIDATION_FAILED",
      status: 502,
      message_key: "errors:invalidResponse",
      details: parsed.error.issues,
    });
  return parsed.data;
}

function legacyLessonId(value: Record<string, unknown>): { lessonId?: string } {
  const lessonId = value.lessonId ?? value.watchLessonId;
  return typeof lessonId === "string" ? { lessonId } : {};
}

function legacySchedule(value: Record<string, unknown>) {
  return {
    ...(typeof value.opensAt === "string" ? { windowStart: value.opensAt } : {}),
    ...(typeof value.closesAt === "string" ? { windowEnd: value.closesAt } : {}),
    ...(typeof value.durationMinutes === "number"
      ? { durationMinutes: value.durationMinutes }
      : {}),
  };
}

function legacyWatchThreshold(value: Record<string, unknown>) {
  return typeof value.requiredWatchPercentage === "number"
    ? { requiredWatchPercentage: value.requiredWatchPercentage }
    : {};
}

function legacyAttemptCount(value: Record<string, unknown>): number {
  const count = value.attemptCount ?? value.attemptsCount;
  return typeof count === "number" ? count : 0;
}

function legacyQuestionIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((selection) => {
    if (typeof selection === "string") return [selection];
    if (!isRecord(selection)) return [];
    const id = selection.questionId ?? selection.sourceQuestionId ?? selection.id;
    return typeof id === "string" ? [id] : [];
  });
}

/** Normalizes target and legacy assessment lists to the shared list envelope.
 * @param value Target or legacy list response.
 * @returns Validated assessment list.
 */
export function adaptAssessmentList(value: unknown) {
  const target = AssessmentListSchema.safeParse(value);
  if (target.success) return target.data;
  const source = legacyList(value);
  const items = source.data.map(adaptAssessment);
  const pagination = source.pagination;
  return AssessmentListSchema.parse({
    items,
    page: pagination?.page ?? 1,
    pageSize: (pagination?.limit ?? items.length) || 1,
    total: pagination?.total ?? items.length,
  });
}

/** Normalizes target teacher attempt summaries.
 * @param value Target attempt response.
 * @returns Validated paginated attempt summaries.
 */
export function adaptAssessmentAttempts(value: unknown) {
  const parsed = AssessmentAttemptListSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  const source = legacyList(value);
  const items = source.data;
  const pagination = source.pagination;
  return AssessmentAttemptListSchema.parse({
    items,
    page: pagination?.page ?? 1,
    pageSize: (pagination?.limit ?? items.length) || 1,
    total: pagination?.total ?? items.length,
    ...legacyResultSummary(value),
  });
}

function legacyResultSummary(value: unknown): {
  summary?: z.infer<typeof AssessmentResultsSummarySchema>;
} {
  if (!isRecord(value) || !("summary" in value)) return {};
  const parsed = AssessmentResultsSummarySchema.safeParse(value.summary);
  if (!parsed.success) throw invalidResponse();
  return { summary: parsed.data };
}

/** Validates a frozen assessment attempt detail payload.
 * @param value Attempt detail response.
 * @returns Validated attempt detail.
 */
export function adaptAssessmentAttemptDetail(value: unknown) {
  const parsed = AssessmentAttemptDetailSchema.safeParse(value);
  if (!parsed.success) throw invalidResponse();
  return parsed.data;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLegacyList(
  value: unknown,
): value is { data: unknown; pagination?: { page?: number; limit?: number; total?: number } } {
  return typeof value === "object" && value !== null && "data" in value;
}

function legacyList(value: unknown): {
  data: unknown[];
  pagination?: { page?: number; limit?: number; total?: number };
} {
  if (!isLegacyList(value) || !Array.isArray(value.data)) throw invalidResponse();
  return value as {
    data: unknown[];
    pagination?: { page?: number; limit?: number; total?: number };
  };
}

function legacyPagination(
  pagination: { page?: number; limit?: number; total?: number } | undefined,
  itemCount: number,
) {
  return {
    page: pagination?.page ?? 1,
    pageSize: (pagination?.limit ?? itemCount) || 1,
    total: pagination?.total ?? itemCount,
  };
}
