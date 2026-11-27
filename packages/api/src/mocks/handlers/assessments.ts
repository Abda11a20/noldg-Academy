import { http, HttpResponse } from "msw";
import {
  QuestionInputSchema,
  QuestionListSchema,
  QuestionSchema,
  type Question,
} from "../../contracts/assessments";
import { API_BASE_URL } from "../../constants/http";
import { MOCK_QUESTIONS } from "../fixtures/assessments";

let questions = structuredClone(MOCK_QUESTIONS);
let questionCounter = MOCK_QUESTIONS.length + 1;

/** Restores the assessment question fixtures between API test cases. */
export function resetAssessmentMockState(): void {
  questions = structuredClone(MOCK_QUESTIONS);
  questionCounter = MOCK_QUESTIONS.length + 1;
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
