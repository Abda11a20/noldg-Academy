import { useMemo, useRef, useState } from "react";
import { useBlocker } from "react-router";
import { useTranslation } from "react-i18next";
import type { Assessment, Question, QuestionEntry } from "@noldg/api/contracts/assessments";
import { capabilities } from "@noldg/api/config/capabilities";
import { useAssessments, useCourseStudents } from "./useAssessments";
import { getAssessmentErrorMessage } from "./useAssessmentErrorToast";
import {
  buildAssessmentCreateInput,
  buildAssessmentUpdateInput,
  draftFromAssessment,
  emptyBuilderDraft,
  validateBuilderDraft,
  type AssessmentBuilderDraft,
  type EditableAssessmentType,
} from "../utils/builder-validation";

function isSupportedQuestion(value: QuestionEntry): value is Question {
  return "correctIndex" in value;
}

function matchesText(value: string | undefined, query: string): boolean {
  return !query || (value ?? "").toLowerCase().includes(query);
}

function matchesQuestionFilters(
  question: Question,
  filters: { search: string; subject: string; lesson: string; difficulty: string },
): boolean {
  const difficultyMatches =
    filters.difficulty === "all" || question.difficulty === filters.difficulty;
  return (
    difficultyMatches &&
    matchesText(question.text, filters.search) &&
    matchesText(question.subjectId, filters.subject) &&
    matchesText(question.lessonId, filters.lesson)
  );
}

function moveItem(values: readonly string[], index: number, direction: "up" | "down"): string[] {
  const next = [...values];
  const destination = direction === "up" ? index - 1 : index + 1;
  if (destination < 0 || destination >= next.length) return next;
  [next[index], next[destination]] = [next[destination] ?? "", next[index] ?? ""];
  return next.filter(Boolean);
}

interface UseAssessmentBuilderOptions {
  courseId: string;
  type: EditableAssessmentType;
  existing?: Assessment;
  onSaved: () => void;
}

/** Owns form draft state, filters, validation, unsaved-leave blocking, and save/publish mutations.
 * @param options Course identifier, assessment type, optional existing record, and post-save navigation.
 */
export function useAssessmentBuilder({
  courseId,
  type,
  existing,
  onSaved,
}: UseAssessmentBuilderOptions) {
  const { t } = useTranslation("assessments");
  const queries = useAssessments(courseId);
  const studentsQuery = useCourseStudents(courseId, capabilities.assessmentTargeting);
  const [draft, setDraft] = useState<AssessmentBuilderDraft>(() =>
    existing ? draftFromAssessment(existing) : emptyBuilderDraft(),
  );
  const [dirty, setDirty] = useState(false);
  const [questionSearch, setQuestionSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [lessonFilter, setLessonFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [studentSearch, setStudentSearch] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const allowNavigationRef = useRef(false);
  const locked = Boolean(existing && existing.attemptCount > 0);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (allowNavigationRef.current) {
      allowNavigationRef.current = false;
      return false;
    }
    return dirty && currentLocation.pathname !== nextLocation.pathname;
  });

  const updateDraft = <K extends keyof AssessmentBuilderDraft>(
    field: K,
    value: AssessmentBuilderDraft[K],
  ) => {
    setDirty(true);
    setServerError(null);
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const allEntries = useMemo(
    () => queries.questions.data?.items ?? [],
    [queries.questions.data?.items],
  );
  const supportedQuestions = useMemo(() => allEntries.filter(isSupportedQuestion), [allEntries]);
  const hasLegacyQuestions = allEntries.length > supportedQuestions.length;

  const visibleQuestions = useMemo(
    () =>
      supportedQuestions.filter((question) =>
        matchesQuestionFilters(question, {
          search: questionSearch.trim().toLowerCase(),
          subject: subjectFilter.trim().toLowerCase(),
          lesson: lessonFilter.trim().toLowerCase(),
          difficulty: difficultyFilter,
        }),
      ),
    [supportedQuestions, questionSearch, subjectFilter, lessonFilter, difficultyFilter],
  );

  const orderedQuestions = useMemo(
    () =>
      draft.selectedIds.flatMap((id) => {
        const question = supportedQuestions.find((item) => item.id === id);
        return question ? [{ id, label: question.text }] : [];
      }),
    [draft.selectedIds, supportedQuestions],
  );

  const visibleStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    const list = studentsQuery.data?.items ?? [];
    return query ? list.filter((student) => student.name.toLowerCase().includes(query)) : list;
  }, [studentSearch, studentsQuery.data?.items]);

  const validationError = validateBuilderDraft(type, draft, existing);
  const pending = queries.create.isPending || queries.update.isPending || queries.publish.isPending;

  const persist = async (andPublish: boolean): Promise<void> => {
    if (pending || validationError) return;
    setServerError(null);
    try {
      const saved = existing
        ? await queries.update.mutateAsync({
            id: existing.id,
            input: buildAssessmentUpdateInput(type, draft, existing),
          })
        : await queries.create.mutateAsync(buildAssessmentCreateInput(courseId, type, draft));
      if (andPublish && saved.status === "draft") {
        await queries.publish.mutateAsync(saved.id);
      }
      allowNavigationRef.current = true;
      setDirty(false);
      onSaved();
    } catch (error) {
      setServerError(getAssessmentErrorMessage(error, t) ?? t("loadError"));
    }
  };

  return {
    queries,
    studentsLoading: studentsQuery.isPending,
    draft,
    locked,
    pending,
    validationError,
    serverError,
    hasLegacyQuestions,
    questions: visibleQuestions,
    orderedQuestions,
    students: visibleStudents,
    questionSearch,
    setQuestionSearch,
    subjectFilter,
    setSubjectFilter,
    lessonFilter,
    setLessonFilter,
    difficultyFilter,
    setDifficultyFilter,
    studentSearch,
    setStudentSearch,
    updateDraft,
    moveQuestion: (index: number, direction: "up" | "down") =>
      updateDraft("selectedIds", moveItem(draft.selectedIds, index, direction)),
    removeQuestion: (id: string) =>
      updateDraft(
        "selectedIds",
        draft.selectedIds.filter((item) => item !== id),
      ),
    saveDraft: () => void persist(false),
    saveAndPublish: () => void persist(true),
    leaveBlocked: blocker.state === "blocked",
    confirmLeave: () => {
      if (blocker.state === "blocked") blocker.proceed();
    },
    cancelLeave: (open: boolean) => {
      if (!open && blocker.state === "blocked") blocker.reset();
    },
  };
}
