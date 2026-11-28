import { z } from "zod";
import { IdSchema, IsoTimestampSchema } from "./common";

export const QuestionDifficultySchema = z.enum(["easy", "medium", "hard"]);
export const QuestionStatusSchema = z.enum(["active", "archived"]);
export const AssessmentQuestionTypeSchema = z.literal("multiple_choice");
export const QuestionOptionSchema = z.object({
  text: z.string().trim().min(1),
  imageUrl: z.string().url().optional(),
});
const QuestionBaseSchema = z.object({
  id: IdSchema,
  type: AssessmentQuestionTypeSchema,
  text: z.string().trim().min(1),
  imageUrl: z.string().url().optional(),
  options: z.array(QuestionOptionSchema).min(2).max(5),
  correctIndex: z.number().int().nonnegative(),
  explanation: z.string().optional(),
  subjectId: IdSchema.optional(),
  lessonId: IdSchema.optional(),
  difficulty: QuestionDifficultySchema.optional(),
  status: QuestionStatusSchema,
  used: z.boolean().optional(),
});
const distinctOptions = (options: Array<{ text: string }>): boolean => {
  const values = options.map((option) => option.text.trim().toLocaleLowerCase("en"));
  return new Set(values).size === values.length;
};
export const QuestionSchema = QuestionBaseSchema.refine(
  (question) => question.correctIndex < question.options.length,
  {
    path: ["correctIndex"],
    message: "correctIndex must identify an existing option",
  },
).refine((question) => distinctOptions(question.options), {
  path: ["options"],
  message: "Options must be distinct",
});

const QuestionInputBaseSchema = QuestionBaseSchema.omit({ id: true, used: true });
export const QuestionInputSchema = QuestionInputBaseSchema.refine(
  (question) => question.correctIndex < question.options.length,
  {
    path: ["correctIndex"],
    message: "correctIndex must identify an existing option",
  },
).refine((question) => distinctOptions(question.options), {
  path: ["options"],
  message: "Options must be distinct",
});
export const QuestionUpdateInputSchema = QuestionInputBaseSchema.partial().refine(
  (input) => Object.keys(input).length > 0,
  { message: "At least one question field must be updated" },
);
export const UnsupportedLegacyQuestionSchema = z.object({
  id: IdSchema,
  text: z.string(),
  legacyType: z.enum(["multiple_choice", "true_false", "essay"]),
  options: z.array(z.string()),
  correctAnswer: z.unknown().optional(),
  supported: z.literal(false),
});
export const QuestionEntrySchema = z.union([QuestionSchema, UnsupportedLegacyQuestionSchema]);
export const QuestionListSchema = z.object({
  items: z.array(QuestionEntrySchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});
export const QuestionListQuerySchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  subjectId: IdSchema.optional(),
  lessonId: IdSchema.optional(),
  difficulty: QuestionDifficultySchema.optional(),
  status: QuestionStatusSchema.optional(),
  search: z.string().optional(),
  courseId: IdSchema.optional(),
});

export const AssessmentTypeSchema = z.enum(["quiz", "homework", "exam"]);
export const AssessmentStatusSchema = z.enum(["draft", "published", "closed", "archived"]);
export const AssessmentQuestionSchema = z.object({
  questionId: IdSchema,
  points: z.number().positive(),
});
const AssessmentBaseSchema = z.object({
  id: IdSchema,
  type: AssessmentTypeSchema,
  courseId: IdSchema,
  lessonId: IdSchema.optional(),
  title: z.string().trim().min(1),
  status: AssessmentStatusSchema,
  questionIds: z.array(IdSchema).min(1),
  randomCount: z.number().int().positive().optional(),
  shuffle: z.boolean().default(true),
  showResults: z.enum(["immediate", "after_close"]),
  maxTabLeaves: z.number().int().nonnegative().optional(),
  targetMode: z.enum(["all_course_students", "selected_students"]),
  studentIds: z.array(IdSchema),
  windowStart: IsoTimestampSchema.optional(),
  windowEnd: IsoTimestampSchema.optional(),
  durationMinutes: z.number().int().positive().optional(),
  maxAttempts: z.number().int().positive(),
  requiredWatchPercentage: z.number().min(1).max(100).optional(),
  attemptCount: z.number().int().nonnegative(),
});

function addAssessmentIssue(context: z.RefinementCtx, path: string, message: string): void {
  context.addIssue({ code: "custom", path: [path], message });
}

function validateAssessmentWindow(
  assessment: { windowStart?: string | undefined; windowEnd?: string | undefined },
  context: z.RefinementCtx,
): void {
  if (
    assessment.windowStart &&
    assessment.windowEnd &&
    Date.parse(assessment.windowEnd) <= Date.parse(assessment.windowStart)
  )
    addAssessmentIssue(context, "windowEnd", "Window end must follow its start");
}

function validateWindowRequired(
  assessment: z.infer<typeof AssessmentBaseSchema>,
  context: z.RefinementCtx,
  type: "Exam" | "Homework",
): void {
  if (!assessment.windowStart)
    addAssessmentIssue(context, "windowStart", `${type} start is required`);
  if (!assessment.windowEnd) addAssessmentIssue(context, "windowEnd", `${type} end is required`);
}

function validateAssessmentType(
  assessment: z.infer<typeof AssessmentBaseSchema>,
  context: z.RefinementCtx,
): void {
  if (assessment.type === "exam") return validateExam(assessment, context);
  if (assessment.type === "homework") return validateHomework(assessment, context);
  validateQuiz(assessment, context);
}

function validateExam(
  assessment: z.infer<typeof AssessmentBaseSchema>,
  context: z.RefinementCtx,
): void {
  validateWindowRequired(assessment, context, "Exam");
  if (!assessment.durationMinutes)
    addAssessmentIssue(context, "durationMinutes", "Exam duration is required");
}

function validateHomework(
  assessment: z.infer<typeof AssessmentBaseSchema>,
  context: z.RefinementCtx,
): void {
  validateWindowRequired(assessment, context, "Homework");
  if (assessment.durationMinutes !== undefined)
    addAssessmentIssue(context, "durationMinutes", "Homework has no duration");
  if (assessment.maxAttempts !== 1)
    addAssessmentIssue(context, "maxAttempts", "Homework allows one attempt");
}

function validateQuiz(
  assessment: z.infer<typeof AssessmentBaseSchema>,
  context: z.RefinementCtx,
): void {
  if (!assessment.lessonId) addAssessmentIssue(context, "lessonId", "Quiz lesson is required");
  if (assessment.windowStart || assessment.windowEnd || assessment.durationMinutes !== undefined)
    addAssessmentIssue(context, "windowStart", "Quiz has no own window or duration");
  if (assessment.maxAttempts !== 1)
    addAssessmentIssue(context, "maxAttempts", "Quiz allows one attempt");
}

function validateAssessmentAudience(
  assessment: z.infer<typeof AssessmentBaseSchema>,
  context: z.RefinementCtx,
): void {
  if (assessment.targetMode === "all_course_students" && assessment.studentIds.length > 0)
    addAssessmentIssue(context, "studentIds", "All-course targeting has no selected IDs");
  if (assessment.targetMode === "selected_students" && assessment.studentIds.length === 0)
    addAssessmentIssue(context, "studentIds", "Selected targeting requires students");
}

export const AssessmentSchema = AssessmentBaseSchema.superRefine((assessment, context) => {
  if (assessment.randomCount && assessment.randomCount > assessment.questionIds.length)
    addAssessmentIssue(context, "randomCount", "Random count exceeds pool");
  validateAssessmentWindow(assessment, context);
  validateAssessmentType(assessment, context);
  validateAssessmentAudience(assessment, context);
});

const AssessmentInputBaseSchema = AssessmentBaseSchema.omit({
  id: true,
  status: true,
  attemptCount: true,
});
export const AssessmentInputSchema = AssessmentInputBaseSchema.superRefine(
  (assessment, context) => {
    if (assessment.randomCount && assessment.randomCount > assessment.questionIds.length)
      addAssessmentIssue(context, "randomCount", "Random count exceeds pool");
    validateAssessmentWindow(assessment, context);
    validateAssessmentType(assessment as z.infer<typeof AssessmentBaseSchema>, context);
    validateAssessmentAudience(assessment as z.infer<typeof AssessmentBaseSchema>, context);
  },
);
export const AssessmentUpdateInputSchema = AssessmentInputBaseSchema.omit({ shuffle: true })
  .partial()
  .extend({ shuffle: z.boolean().optional() })
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one assessment field must be updated",
  });
export const AssessmentListQuerySchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  courseId: IdSchema.optional(),
  lessonId: IdSchema.optional(),
  type: AssessmentTypeSchema.optional(),
  status: AssessmentStatusSchema.optional(),
  search: z.string().optional(),
});

export const AssessmentListSchema = z.object({
  items: z.array(AssessmentSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});
export const AssessmentAttemptSummarySchema = z.object({
  id: IdSchema,
  student: z.object({ id: IdSchema, name: z.string() }),
  score: z.number().nullable(),
  total: z.number().nonnegative(),
  startedAt: IsoTimestampSchema,
  submittedAt: IsoTimestampSchema.nullable(),
  submitReason: z.enum(["manual", "auto"]).nullable(),
  tabLeaves: z.number().int().nonnegative(),
  suspicious: z.boolean(),
});
export const AssessmentResultsSummarySchema = z.object({
  averageScore: z.number().nullable(),
  manualCount: z.number().int().nonnegative(),
  autoCount: z.number().int().nonnegative(),
  suspiciousCount: z.number().int().nonnegative(),
});
export const AssessmentAttemptListSchema = z.object({
  items: z.array(AssessmentAttemptSummarySchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  summary: AssessmentResultsSummarySchema.optional(),
});
export type AssessmentAttemptList = z.infer<typeof AssessmentAttemptListSchema>;
export const AssessmentAttemptListQuerySchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  search: z.string().optional(),
  suspicious: z.boolean().optional(),
});
export const CourseStudentSchema = z.object({
  id: IdSchema,
  name: z.string().trim().min(1),
});
export const CourseStudentListSchema = z.object({
  items: z.array(CourseStudentSchema),
});
export const AssessmentAttemptDetailSchema = z.object({
  id: IdSchema,
  assessmentId: IdSchema,
  student: z.object({ id: IdSchema, name: z.string() }),
  score: z.number().nullable(),
  total: z.number().nonnegative(),
  startedAt: IsoTimestampSchema,
  submittedAt: IsoTimestampSchema.nullable(),
  submitReason: z.enum(["manual", "auto"]).nullable(),
  tabLeaves: z.number().int().nonnegative(),
  suspicious: z.boolean(),
  questions: z.array(
    z.object({
      question: QuestionSchema,
      selectedIndex: z.number().int().nonnegative().nullable(),
    }),
  ),
});
export const AssessmentErrorCodeSchema = z.enum([
  "ASSESSMENT_LOCKED",
  "ASSESSMENT_WINDOW_INVALID",
  "POOL_TOO_SMALL",
  "NO_QUESTIONS",
  "QUESTION_INVALID",
  "QUESTION_IN_USE",
  "TARGET_STUDENT_INVALID",
]);

export type Question = z.infer<typeof QuestionSchema>;
export type QuestionEntry = z.infer<typeof QuestionEntrySchema>;
export type QuestionInput = z.infer<typeof QuestionInputSchema>;
export type QuestionUpdateInput = z.infer<typeof QuestionUpdateInputSchema>;
export type QuestionListQuery = z.infer<typeof QuestionListQuerySchema>;
export type Assessment = z.infer<typeof AssessmentSchema>;
export type AssessmentInput = z.infer<typeof AssessmentInputSchema>;
export type AssessmentUpdateInput = z.infer<typeof AssessmentUpdateInputSchema>;
export type AssessmentListQuery = z.infer<typeof AssessmentListQuerySchema>;
export type AssessmentType = z.infer<typeof AssessmentTypeSchema>;
export type AssessmentAttemptDetail = z.infer<typeof AssessmentAttemptDetailSchema>;
export type AssessmentAttemptSummary = z.infer<typeof AssessmentAttemptSummarySchema>;
export type AssessmentResultsSummary = z.infer<typeof AssessmentResultsSummarySchema>;
export type AssessmentAttemptListQuery = z.infer<typeof AssessmentAttemptListQuerySchema>;
export type CourseStudent = z.infer<typeof CourseStudentSchema>;
export type CourseStudentList = z.infer<typeof CourseStudentListSchema>;
