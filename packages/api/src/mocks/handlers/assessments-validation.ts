import { HttpResponse } from "msw";
import {
  AssessmentSchema,
  AssessmentUpdateInputSchema,
  type Assessment,
} from "../../contracts/assessments";
import { MOCK_COURSE_STUDENTS } from "../fixtures/assessments";

/** Checks whether a targeted assessment references students outside the course roster. */
export function hasUnknownTargetStudents(
  targetMode: "all_course_students" | "selected_students",
  studentIds: readonly string[],
): boolean {
  if (targetMode !== "selected_students") return false;
  const knownIds = new Set(MOCK_COURSE_STUDENTS.map((student) => student.id));
  return studentIds.length === 0 || studentIds.some((id) => !knownIds.has(id));
}

function statusTransitionError(
  assessment: Assessment,
  status: "published" | "closed" | "archived",
): Response | null {
  if (assessment.attemptCount > 0 && status === "archived")
    return HttpResponse.json({ error: { code: "ASSESSMENT_LOCKED" } }, { status: 409 });
  if (status !== "published") return null;
  if (assessment.randomCount && assessment.randomCount > assessment.questionIds.length)
    return HttpResponse.json({ error: { code: "POOL_TOO_SMALL" } }, { status: 400 });
  if (
    assessment.windowStart &&
    assessment.windowEnd &&
    Date.parse(assessment.windowEnd) <= Date.parse(assessment.windowStart)
  )
    return HttpResponse.json({ error: { code: "ASSESSMENT_WINDOW_INVALID" } }, { status: 400 });
  return null;
}

/** Validates and applies a mock assessment status change with locked/pool/window checks. */
export function changeMockAssessmentStatus(
  assessments: Assessment[],
  assessmentId: string,
  status: "published" | "closed" | "archived",
): { response: Response; updated?: Assessment } {
  const assessment = assessments.find((entry) => entry.id === assessmentId);
  if (!assessment)
    return { response: HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 }) };
  const errorResponse = statusTransitionError(assessment, status);
  if (errorResponse) return { response: errorResponse };
  const updated = AssessmentSchema.parse({ ...assessment, status });
  return { response: HttpResponse.json(updated), updated };
}

/** Validates and applies a mock assessment PATCH honoring locked-after-first-attempt rules. */
export function updateMockAssessment(
  assessments: Assessment[],
  assessmentId: string,
  rawBody: unknown,
): { response: Response; updated?: Assessment } {
  const existing = assessments.find((entry) => entry.id === assessmentId);
  if (!existing)
    return { response: HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 }) };
  const parsed = AssessmentUpdateInputSchema.safeParse(rawBody);
  if (!parsed.success)
    return {
      response: HttpResponse.json(
        { error: { code: assessmentInputErrorCode(rawBody) } },
        { status: 400 },
      ),
    };
  const patch = parsed.data;
  if (existing.attemptCount > 0 && !isLockedWindowExtensionOnly(existing, patch))
    return {
      response: HttpResponse.json({ error: { code: "ASSESSMENT_LOCKED" } }, { status: 409 }),
    };
  const candidate = { ...existing, ...patch };
  if (
    hasUnknownTargetStudents(
      candidate.targetMode ?? existing.targetMode,
      candidate.studentIds ?? existing.studentIds,
    )
  )
    return {
      response: HttpResponse.json({ error: { code: "TARGET_STUDENT_INVALID" } }, { status: 400 }),
    };
  const validated = AssessmentSchema.safeParse(candidate);
  if (!validated.success)
    return {
      response: HttpResponse.json(
        { error: { code: assessmentInputErrorCode(candidate) } },
        { status: 400 },
      ),
    };
  return { response: HttpResponse.json(validated.data), updated: validated.data };
}

function isLockedWindowExtensionOnly(
  existing: Assessment,
  patch: Record<string, unknown>,
): boolean {
  const keys = Object.keys(patch);
  return (
    keys.length === 1 &&
    keys[0] === "windowEnd" &&
    typeof patch.windowEnd === "string" &&
    Boolean(existing.windowEnd) &&
    Date.parse(patch.windowEnd) > Date.parse(existing.windowEnd ?? "")
  );
}

/** Maps invalid mock write inputs to the target assessment error code.
 * @param value Untrusted create payload received by the mock handler.
 */
export function assessmentInputErrorCode(value: unknown): string {
  if (typeof value !== "object" || value === null) return "QUESTION_INVALID";
  if (hasNoQuestions(value)) return "NO_QUESTIONS";
  if (hasRandomCountOverPool(value)) return "POOL_TOO_SMALL";
  if (hasReversedWindow(value)) return "ASSESSMENT_WINDOW_INVALID";
  if (hasInvalidTargetSelection(value)) return "TARGET_STUDENT_INVALID";
  return "QUESTION_INVALID";
}

function hasNoQuestions(value: object): boolean {
  return (
    "questionIds" in value && Array.isArray(value.questionIds) && value.questionIds.length === 0
  );
}

function hasRandomCountOverPool(value: object): boolean {
  return (
    "questionIds" in value &&
    Array.isArray(value.questionIds) &&
    "randomCount" in value &&
    typeof value.randomCount === "number" &&
    value.randomCount > value.questionIds.length
  );
}

function hasReversedWindow(value: object): boolean {
  return (
    "windowStart" in value &&
    "windowEnd" in value &&
    typeof value.windowStart === "string" &&
    typeof value.windowEnd === "string" &&
    Date.parse(value.windowEnd) <= Date.parse(value.windowStart)
  );
}

function hasInvalidTargetSelection(value: object): boolean {
  return (
    "targetMode" in value &&
    value.targetMode === "selected_students" &&
    "studentIds" in value &&
    Array.isArray(value.studentIds) &&
    value.studentIds.length === 0
  );
}
