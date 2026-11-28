import { http, HttpResponse } from "msw";
import {
  AssessmentInputSchema,
  AssessmentListSchema,
  AssessmentSchema,
  AssessmentUpdateInputSchema,
  QuestionInputSchema,
  QuestionListSchema,
  QuestionSchema,
  type Question,
} from "../../contracts/assessments";
import { API_BASE_URL } from "../../constants/http";
import {
  MOCK_ASSESSMENTS,
  MOCK_ASSESSMENT_ATTEMPTS,
  MOCK_ASSESSMENT_ATTEMPT_DETAIL,
  MOCK_ASSESSMENT_RESULTS_SUMMARY,
  MOCK_QUESTIONS,
} from "../fixtures/assessments";

let questions = structuredClone(MOCK_QUESTIONS);
let questionCounter = MOCK_QUESTIONS.length + 1;
let assessments = structuredClone(MOCK_ASSESSMENTS.items);
let assessmentCounter = assessments.length + 1;

/** Restores the assessment question fixtures between API test cases. */
export function resetAssessmentMockState(): void {
  questions = structuredClone(MOCK_QUESTIONS);
  questionCounter = MOCK_QUESTIONS.length + 1;
  assessments = structuredClone(MOCK_ASSESSMENTS.items);
  assessmentCounter = assessments.length + 1;
}

function assessmentListResponse(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.max(1, Number(url.searchParams.get("pageSize") ?? 20));
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status");
  const courseId = url.searchParams.get("courseId");
  const matches = assessments.filter(
    (assessment) =>
      (!type || assessment.type === type) &&
      (!status || assessment.status === status) &&
      (!courseId || assessment.courseId === courseId),
  );
  return AssessmentListSchema.parse({
    items: matches.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total: matches.length,
  });
}

function listResponse(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.max(1, Number(url.searchParams.get("pageSize") ?? 20));
  const search = url.searchParams.get("q")?.toLocaleLowerCase("en");
  const matches = questions.filter(
    (question) =>
      (!search || question.text.toLocaleLowerCase("en").includes(search)) &&
      (!url.searchParams.get("subjectId") ||
        question.subjectId === url.searchParams.get("subjectId")) &&
      (!url.searchParams.get("lessonId") ||
        question.lessonId === url.searchParams.get("lessonId")) &&
      (!url.searchParams.get("difficulty") ||
        question.difficulty === url.searchParams.get("difficulty")) &&
      (!url.searchParams.get("status") || question.status === url.searchParams.get("status")),
  );
  return QuestionListSchema.parse({
    items: matches.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total: matches.length,
  });
}

function findQuestion(questionId: string): Question | undefined {
  return questions.find((question) => question.id === questionId);
}

export const assessmentHandlers = [
  http.get(`${API_BASE_URL}/assessments/my`, ({ request }) => {
    const url = new URL(request.url);
    const scenario = url.searchParams.get("scenario");
    if (scenario === "error")
      return HttpResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 503 });
    if (scenario === "forbidden")
      return HttpResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    if (scenario === "empty")
      return HttpResponse.json({ items: [], page: 1, pageSize: 20, total: 0 });
    return HttpResponse.json(assessmentListResponse(url));
  }),
  http.get(`${API_BASE_URL}/assessments/courses/:courseId`, ({ params, request }) => {
    const url = new URL(request.url);
    url.searchParams.set("courseId", String(params.courseId));
    return HttpResponse.json(assessmentListResponse(url));
  }),
  http.post(`${API_BASE_URL}/assessments`, async ({ request }) => {
    const rawInput: unknown = await request.json();
    const parsed = AssessmentInputSchema.safeParse(rawInput);
    if (!parsed.success)
      return HttpResponse.json(
        { error: { code: assessmentInputErrorCode(rawInput) } },
        { status: 400 },
      );
    const assessment = AssessmentSchema.parse({
      ...parsed.data,
      id: `assessment-mock-${assessmentCounter++}`,
      status: "draft",
      attemptCount: 0,
    });
    assessments.unshift(assessment);
    return HttpResponse.json(assessment, { status: 201 });
  }),
  http.get(`${API_BASE_URL}/assessments/:assessmentId/attempts/:attemptId`, ({ params }) => {
    if (
      params.assessmentId !== MOCK_ASSESSMENT_ATTEMPT_DETAIL.assessmentId ||
      params.attemptId !== MOCK_ASSESSMENT_ATTEMPT_DETAIL.id
    )
      return HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    return HttpResponse.json(MOCK_ASSESSMENT_ATTEMPT_DETAIL);
  }),
  http.get(`${API_BASE_URL}/assessments/:assessmentId/attempts`, ({ request }) => {
    const url = new URL(request.url);
    const suspicious = url.searchParams.get("suspicious");
    const items = MOCK_ASSESSMENT_ATTEMPTS.filter(
      (attempt) => suspicious === null || String(attempt.suspicious) === suspicious,
    );
    return HttpResponse.json({
      items,
      page: Number(url.searchParams.get("page") ?? 1),
      pageSize: Number(url.searchParams.get("pageSize") ?? 20),
      total: items.length,
      summary: MOCK_ASSESSMENT_RESULTS_SUMMARY,
    });
  }),
  http.get(`${API_BASE_URL}/assessments/:assessmentId`, ({ params }) => {
    const assessment = assessments.find((entry) => entry.id === String(params.assessmentId));
    if (!assessment) return HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    return HttpResponse.json(assessment);
  }),
  http.patch(`${API_BASE_URL}/assessments/:assessmentId/publish`, ({ params }) => {
    return changeMockAssessmentStatus(String(params.assessmentId), "published");
  }),
  http.patch(`${API_BASE_URL}/assessments/:assessmentId/close`, ({ params }) => {
    return changeMockAssessmentStatus(String(params.assessmentId), "closed");
  }),
  http.patch(`${API_BASE_URL}/assessments/:assessmentId/archive`, ({ params }) => {
    return changeMockAssessmentStatus(String(params.assessmentId), "archived");
  }),
  http.patch(`${API_BASE_URL}/assessments/:assessmentId`, async ({ params, request }) => {
    const assessmentId = String(params.assessmentId);
    const existing = assessments.find((entry) => entry.id === assessmentId);
    if (!existing) return HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    if (existing.attemptCount > 0)
      return HttpResponse.json({ error: { code: "ASSESSMENT_LOCKED" } }, { status: 409 });
    const parsed = AssessmentUpdateInputSchema.safeParse(await request.json());
    if (!parsed.success)
      return HttpResponse.json({ error: { code: "ASSESSMENT_WINDOW_INVALID" } }, { status: 400 });
    const updated = AssessmentSchema.parse({ ...existing, ...parsed.data });
    assessments = assessments.map((entry) => (entry.id === updated.id ? updated : entry));
    return HttpResponse.json(updated);
  }),
  http.get(`${API_BASE_URL}/questions/my`, ({ request }) => {
    const url = new URL(request.url);
    const scenario = url.searchParams.get("scenario");
    if (scenario === "error")
      return HttpResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 503 });
    if (scenario === "forbidden")
      return HttpResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    if (scenario === "empty")
      return HttpResponse.json({ items: [], page: 1, pageSize: 20, total: 0 });
    return HttpResponse.json(listResponse(url));
  }),
  http.post(`${API_BASE_URL}/questions`, async ({ request }) => {
    const parsed = QuestionInputSchema.safeParse(await request.json());
    if (!parsed.success)
      return HttpResponse.json({ error: { code: "QUESTION_INVALID" } }, { status: 400 });
    const question = QuestionSchema.parse({
      ...parsed.data,
      id: `question-mock-${questionCounter++}`,
      used: false,
    });
    questions.unshift(question);
    return HttpResponse.json(question, { status: 201 });
  }),
  http.get(`${API_BASE_URL}/questions/:questionId`, ({ params }) => {
    const question = findQuestion(String(params.questionId));
    if (!question) return HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    return HttpResponse.json(question);
  }),
  http.patch(`${API_BASE_URL}/questions/:questionId`, async ({ params, request }) => {
    const question = findQuestion(String(params.questionId));
    if (!question) return HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    const body = (await request.json()) as Partial<Question>;
    const updated = QuestionSchema.parse({ ...question, ...body });
    questions = questions.map((entry) => (entry.id === updated.id ? updated : entry));
    return HttpResponse.json(updated);
  }),
  http.post(`${API_BASE_URL}/questions/:questionId/:action`, ({ params }) => {
    const question = findQuestion(String(params.questionId));
    if (!question) return HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    const action = params.action;
    if (action !== "archive" && action !== "restore")
      return HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    const updated = QuestionSchema.parse({
      ...question,
      status: action === "archive" ? "archived" : "active",
    });
    questions = questions.map((entry) => (entry.id === updated.id ? updated : entry));
    return HttpResponse.json(updated);
  }),
];

function changeMockAssessmentStatus(
  assessmentId: string,
  status: "published" | "closed" | "archived",
) {
  const assessment = assessments.find((entry) => entry.id === assessmentId);
  if (!assessment) return HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  if (isLockedAssessmentAction(assessment, status))
    return HttpResponse.json({ error: { code: "ASSESSMENT_LOCKED" } }, { status: 409 });
  if (hasInsufficientQuestionPool(assessment, status))
    return HttpResponse.json({ error: { code: "POOL_TOO_SMALL" } }, { status: 400 });
  if (hasInvalidAssessmentWindow(assessment, status))
    return HttpResponse.json({ error: { code: "ASSESSMENT_WINDOW_INVALID" } }, { status: 400 });
  const updated = AssessmentSchema.parse({ ...assessment, status });
  assessments = assessments.map((entry) => (entry.id === updated.id ? updated : entry));
  return HttpResponse.json(updated);
}

function isLockedAssessmentAction(
  assessment: (typeof assessments)[number],
  status: "published" | "closed" | "archived",
): boolean {
  return assessment.attemptCount > 0 && status === "archived";
}

function hasInsufficientQuestionPool(
  assessment: (typeof assessments)[number],
  status: "published" | "closed" | "archived",
): boolean {
  return Boolean(
    status === "published" &&
    assessment.randomCount &&
    assessment.randomCount > assessment.questionIds.length,
  );
}

function hasInvalidAssessmentWindow(
  assessment: (typeof assessments)[number],
  status: "published" | "closed" | "archived",
): boolean {
  return Boolean(
    status === "published" &&
    assessment.windowStart &&
    assessment.windowEnd &&
    Date.parse(assessment.windowEnd) <= Date.parse(assessment.windowStart),
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
