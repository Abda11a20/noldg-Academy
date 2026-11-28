import { useMemo, useState } from "react";
import type { AssessmentInput, AssessmentType, Question } from "@noldg/api/contracts/assessments";
import { cairoLocalToIso } from "../../../shared/time/time";
import { useAssessments } from "./useAssessments";

/** Owns question selection, form values, and draft submission for assessment builders.
 * @param courseId Teacher-owned course identifier.
 * @param type Exam or homework type selected by the route.
 */
export function useAssessmentBuilder(courseId: string, type: "exam" | "homework") {
  const queries = useAssessments(courseId);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("60");
  const [maxAttempts, setMaxAttempts] = useState("1");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [questionSearch, setQuestionSearch] = useState("");
  const questions = useMemo(
    () => queries.questions.data?.items.filter(isSupportedQuestion) ?? [],
    [queries.questions.data?.items],
  );
  const visibleQuestions = filterQuestions(questions, questionSearch);
  const orderedQuestions = selectedIds.flatMap((id) => {
    const question = questions.find((item) => item.id === id);
    return question ? [{ id, label: question.text }] : [];
  });
  const submit = () =>
    submitAssessment(queries, courseId, type, {
      title,
      duration,
      maxAttempts,
      start,
      end,
      selectedIds,
    });
  const moveQuestion = (index: number, direction: "up" | "down") =>
    setSelectedIds((current) => moveItem(current, index, direction));
  const removeQuestion = (id: string) =>
    setSelectedIds((current) => current.filter((item) => item !== id));
  return {
    queries,
    title,
    setTitle,
    duration,
    setDuration,
    maxAttempts,
    setMaxAttempts,
    start,
    setStart,
    end,
    setEnd,
    selectedIds,
    setSelectedIds,
    questionSearch,
    setQuestionSearch,
    questions: visibleQuestions,
    orderedQuestions,
    submit,
    moveQuestion,
    removeQuestion,
  };
}

function isSupportedQuestion(value: unknown): value is Question {
  return typeof value === "object" && value !== null && "correctIndex" in value;
}

function filterQuestions(questions: readonly Question[], search: string): Question[] {
  const normalizedSearch = search.toLowerCase();
  return questions.filter((question) => question.text.toLowerCase().includes(normalizedSearch));
}

function moveItem(values: readonly string[], index: number, direction: "up" | "down"): string[] {
  const next = [...values];
  const destination = direction === "up" ? index - 1 : index + 1;
  if (destination < 0 || destination >= next.length) return next;
  [next[index], next[destination]] = [next[destination] ?? "", next[index] ?? ""];
  return next.filter(Boolean);
}

function submitAssessment(
  queries: ReturnType<typeof useAssessments>,
  courseId: string,
  type: AssessmentType,
  values: {
    title: string;
    duration: string;
    maxAttempts: string;
    start: string;
    end: string;
    selectedIds: readonly string[];
  },
) {
  if (!canSubmit(values, queries.create.isPending)) return;
  return queries.create.mutateAsync(buildAssessmentInput(courseId, type, values));
}

function canSubmit(
  values: { title: string; start: string; end: string; selectedIds: readonly string[] },
  pending: boolean,
): boolean {
  return (
    Boolean(values.title.trim() && values.selectedIds.length && values.start && values.end) &&
    !pending
  );
}

function buildAssessmentInput(
  courseId: string,
  type: AssessmentType,
  values: {
    title: string;
    duration: string;
    maxAttempts: string;
    start: string;
    end: string;
    selectedIds: readonly string[];
  },
): AssessmentInput {
  return {
    type,
    courseId,
    title: values.title.trim(),
    questionIds: [...values.selectedIds],
    shuffle: true,
    showResults: "immediate",
    targetMode: "all_course_students",
    studentIds: [],
    windowStart: cairoLocalToIso(values.start),
    windowEnd: cairoLocalToIso(values.end),
    ...(type === "exam" ? { durationMinutes: Number(values.duration) } : {}),
    maxAttempts: type === "exam" ? Number(values.maxAttempts) : 1,
  };
}
