import { z } from "zod";
import {
  QuestionEntrySchema,
  QuestionListSchema,
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

function isLegacyList(
  value: unknown,
): value is { data: unknown; pagination?: { page?: number; limit?: number; total?: number } } {
  return typeof value === "object" && value !== null && "data" in value;
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
