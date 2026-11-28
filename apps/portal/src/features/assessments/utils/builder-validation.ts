import type {
  Assessment,
  AssessmentInput,
  AssessmentUpdateInput,
} from "@noldg/api/contracts/assessments";
import {
  cairoDateBoundaryToIso,
  isAfterTimestamp,
  isoToCairoLocal,
  tryCairoLocalToIso,
} from "../../../shared/time/time";

export type EditableAssessmentType = "exam" | "homework";

export type BuilderValidationKey =
  | "titleRequired"
  | "windowRequired"
  | "windowInvalid"
  | "endExtendOnly"
  | "durationRequired"
  | "attemptsRequired"
  | "questionsRequired"
  | "poolTooSmall"
  | "studentsRequired";

export interface AssessmentBuilderDraft {
  title: string;
  start: string;
  end: string;
  duration: string;
  maxAttempts: string;
  shuffle: boolean;
  randomCount: string;
  showResults: "immediate" | "after_close";
  maxTabLeaves: string;
  targetMode: "all_course_students" | "selected_students";
  studentIds: readonly string[];
  selectedIds: readonly string[];
}

/** Creates an empty draft for a new exam or homework builder session. */
export function emptyBuilderDraft(): AssessmentBuilderDraft {
  return {
    title: "",
    start: "",
    end: "",
    duration: "60",
    maxAttempts: "1",
    shuffle: true,
    randomCount: "",
    showResults: "immediate",
    maxTabLeaves: "",
    targetMode: "all_course_students",
    studentIds: [],
    selectedIds: [],
  };
}

function formatWindowInput(iso: string | undefined, type: EditableAssessmentType): string {
  if (!iso) return "";
  try {
    const cairoLocal = isoToCairoLocal(iso);
    return type === "homework" ? cairoLocal.slice(0, 10) : cairoLocal;
  } catch {
    return "";
  }
}

/** Hydrates builder form state from an existing server assessment record. */
export function draftFromAssessment(assessment: Assessment): AssessmentBuilderDraft {
  const type: EditableAssessmentType = assessment.type === "homework" ? "homework" : "exam";
  return {
    title: assessment.title,
    start: formatWindowInput(assessment.windowStart, type),
    end: formatWindowInput(assessment.windowEnd, type),
    duration: assessment.durationMinutes ? String(assessment.durationMinutes) : "60",
    maxAttempts: String(assessment.maxAttempts),
    shuffle: assessment.shuffle,
    randomCount: assessment.randomCount ? String(assessment.randomCount) : "",
    showResults: assessment.showResults,
    maxTabLeaves: assessment.maxTabLeaves === undefined ? "" : String(assessment.maxTabLeaves),
    targetMode: assessment.targetMode,
    studentIds: [...assessment.studentIds],
    selectedIds: [...assessment.questionIds],
  };
}

function tryDateBoundary(value: string, boundary: "startOfDay" | "endOfDay"): string | undefined {
  try {
    return cairoDateBoundaryToIso(value, boundary);
  } catch {
    return undefined;
  }
}

/** Converts Cairo form window inputs to UTC ISO timestamps via the shared time module. */
function draftWindowToIso(
  type: EditableAssessmentType,
  start: string,
  end: string,
): { windowStart?: string; windowEnd?: string } {
  const windowStart =
    type === "homework" ? tryDateBoundary(start, "startOfDay") : tryCairoLocalToIso(start);
  const windowEnd =
    type === "homework" ? tryDateBoundary(end, "endOfDay") : tryCairoLocalToIso(end);
  return {
    ...(windowStart ? { windowStart } : {}),
    ...(windowEnd ? { windowEnd } : {}),
  };
}

function parseOptionalPositiveInt(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseOptionalNonNegativeInt(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function validateWindow(
  type: EditableAssessmentType,
  draft: AssessmentBuilderDraft,
  existing?: Assessment,
): BuilderValidationKey | null {
  if (!draft.start || !draft.end) return "windowRequired";
  const { windowStart, windowEnd } = draftWindowToIso(type, draft.start, draft.end);
  if (!windowStart || !windowEnd || !isAfterTimestamp(windowEnd, windowStart)) {
    return "windowInvalid";
  }
  if (
    existing &&
    existing.attemptCount > 0 &&
    existing.windowEnd &&
    !isAfterTimestamp(windowEnd, existing.windowEnd)
  ) {
    return "endExtendOnly";
  }
  return null;
}

function validateExamRules(
  type: EditableAssessmentType,
  draft: AssessmentBuilderDraft,
): BuilderValidationKey | null {
  if (type !== "exam") return null;
  if (!parseOptionalPositiveInt(draft.duration)) return "durationRequired";
  if (!parseOptionalPositiveInt(draft.maxAttempts)) return "attemptsRequired";
  return null;
}

function validatePoolAndAudience(draft: AssessmentBuilderDraft): BuilderValidationKey | null {
  if (draft.selectedIds.length === 0) return "questionsRequired";
  const randomCount = parseOptionalPositiveInt(draft.randomCount);
  if (randomCount && randomCount > draft.selectedIds.length) return "poolTooSmall";
  if (draft.targetMode === "selected_students" && draft.studentIds.length === 0) {
    return "studentsRequired";
  }
  return null;
}

/** Validates builder draft fields and returns the first localized reason blocking save/publish. */
export function validateBuilderDraft(
  type: EditableAssessmentType,
  draft: AssessmentBuilderDraft,
  existing?: Assessment,
): BuilderValidationKey | null {
  if (!draft.title.trim()) return "titleRequired";
  const windowError = validateWindow(type, draft, existing);
  if (windowError) return windowError;
  if (existing && existing.attemptCount > 0) return null;
  return validateExamRules(type, draft) ?? validatePoolAndAudience(draft);
}

/** Builds a target create payload from validated builder form state. */
export function buildAssessmentCreateInput(
  courseId: string,
  type: EditableAssessmentType,
  draft: AssessmentBuilderDraft,
): AssessmentInput {
  const { windowStart, windowEnd } = draftWindowToIso(type, draft.start, draft.end);
  const randomCount = parseOptionalPositiveInt(draft.randomCount);
  const maxTabLeaves = parseOptionalNonNegativeInt(draft.maxTabLeaves);
  return {
    type,
    courseId,
    title: draft.title.trim(),
    questionIds: [...draft.selectedIds],
    ...(randomCount ? { randomCount } : {}),
    shuffle: draft.shuffle,
    showResults: draft.showResults,
    ...(maxTabLeaves === undefined ? {} : { maxTabLeaves }),
    targetMode: draft.targetMode,
    studentIds: draft.targetMode === "selected_students" ? [...draft.studentIds] : [],
    ...(windowStart ? { windowStart } : {}),
    ...(windowEnd ? { windowEnd } : {}),
    ...(type === "exam" ? { durationMinutes: Number(draft.duration) } : {}),
    maxAttempts: type === "exam" ? Number(draft.maxAttempts) : 1,
  };
}

/** Builds a target update payload; locked assessments only transmit an extended window end. */
export function buildAssessmentUpdateInput(
  type: EditableAssessmentType,
  draft: AssessmentBuilderDraft,
  existing: Assessment,
): AssessmentUpdateInput {
  const { windowStart, windowEnd } = draftWindowToIso(type, draft.start, draft.end);
  if (existing.attemptCount > 0) {
    return { ...(windowEnd ? { windowEnd } : {}) };
  }
  const randomCount = parseOptionalPositiveInt(draft.randomCount);
  const maxTabLeaves = parseOptionalNonNegativeInt(draft.maxTabLeaves);
  return {
    title: draft.title.trim(),
    questionIds: [...draft.selectedIds],
    ...(randomCount ? { randomCount } : {}),
    shuffle: draft.shuffle,
    showResults: draft.showResults,
    ...(maxTabLeaves === undefined ? {} : { maxTabLeaves }),
    targetMode: draft.targetMode,
    studentIds: draft.targetMode === "selected_students" ? [...draft.studentIds] : [],
    ...(windowStart ? { windowStart } : {}),
    ...(windowEnd ? { windowEnd } : {}),
    ...(type === "exam" ? { durationMinutes: Number(draft.duration) } : {}),
    maxAttempts: type === "exam" ? Number(draft.maxAttempts) : 1,
  };
}

/** Creates a client-side draft copy input for duplicating an existing assessment. */
export function buildDuplicateAssessmentInput(
  source: Assessment,
  copyTitle: string,
): AssessmentInput {
  return {
    type: source.type,
    courseId: source.courseId,
    ...(source.lessonId ? { lessonId: source.lessonId } : {}),
    title: copyTitle,
    questionIds: [...source.questionIds],
    ...(source.randomCount ? { randomCount: source.randomCount } : {}),
    shuffle: source.shuffle,
    showResults: source.showResults,
    ...(source.maxTabLeaves === undefined ? {} : { maxTabLeaves: source.maxTabLeaves }),
    targetMode: source.targetMode,
    studentIds: [...source.studentIds],
    ...(source.windowStart ? { windowStart: source.windowStart } : {}),
    ...(source.windowEnd ? { windowEnd: source.windowEnd } : {}),
    ...(source.durationMinutes === undefined ? {} : { durationMinutes: source.durationMinutes }),
    maxAttempts: source.maxAttempts,
    ...(source.requiredWatchPercentage === undefined
      ? {}
      : { requiredWatchPercentage: source.requiredWatchPercentage }),
  };
}
