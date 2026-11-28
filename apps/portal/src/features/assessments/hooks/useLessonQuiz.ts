import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AssessmentInput } from "@noldg/api/contracts/assessments";
import { createAssessment, publishAssessment } from "@noldg/api/endpoints/assessments";
import { capabilities } from "@noldg/api/config/capabilities";
import {
  ASSESSMENT_MAX_WATCH_PERCENTAGE,
  ASSESSMENT_MIN_WATCH_PERCENTAGE,
  DEFAULT_ASSESSMENT_SHOW_RESULTS,
  DEFAULT_QUIZ_WATCH_PERCENTAGE,
} from "../constants";
import { useAssessmentErrorToast } from "./useAssessmentErrorToast";
import { useAssessments } from "./useAssessments";
import { assessmentQueryKeys } from "../assessment-query-keys";

function parseWatchPercentage(value: string): number | null {
  const parsed = Number(value.trim());
  if (!Number.isInteger(parsed)) return null;
  if (parsed < ASSESSMENT_MIN_WATCH_PERCENTAGE || parsed > ASSESSMENT_MAX_WATCH_PERCENTAGE) {
    return null;
  }
  return parsed;
}

/** Loads a lesson quiz and manages draft creation, publish, inline question addition, and threshold.
 * @param courseId Teacher course identifier.
 * @param lessonId Existing lesson identifier.
 */
export function useLessonQuiz(courseId: string, lessonId: string) {
  const queryClient = useQueryClient();
  const reportError = useAssessmentErrorToast();
  const data = useAssessments(courseId);
  const [title, setTitle] = useState("");
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [watchPercentage, setWatchPercentage] = useState(String(DEFAULT_QUIZ_WATCH_PERCENTAGE));

  const existingQuiz = useMemo(
    () =>
      data.assessments.data?.items.find(
        (item) => item.type === "quiz" && item.lessonId === lessonId,
      ),
    [data.assessments.data?.items, lessonId],
  );

  const parsedWatchPercentage = parseWatchPercentage(watchPercentage);
  const canSubmit =
    Boolean(title.trim()) && selectedIds.length > 0 && parsedWatchPercentage !== null;

  const saveQuiz = useMutation({
    mutationFn: async (options: { andPublish: boolean }) => {
      const requiredWatchPercentage = parsedWatchPercentage ?? DEFAULT_QUIZ_WATCH_PERCENTAGE;
      const input: AssessmentInput = {
        type: "quiz",
        courseId,
        lessonId,
        title: title.trim(),
        questionIds: [...selectedIds],
        shuffle: true,
        showResults: DEFAULT_ASSESSMENT_SHOW_RESULTS,
        targetMode: "all_course_students",
        studentIds: [],
        requiredWatchPercentage,
        maxAttempts: 1,
      };
      const created = await createAssessment(input);
      try {
        return options.andPublish ? await publishAssessment(created.id) : created;
      } finally {
        await queryClient.invalidateQueries({ queryKey: assessmentQueryKeys.root });
      }
    },
    onError: reportError,
  });

  const submitQuiz = (andPublish: boolean) => {
    if (!canSubmit || saveQuiz.isPending) return;
    saveQuiz.mutate({ andPublish });
  };

  const addSelectedQuestion = (questionId: string) => {
    setSelectedIds((current) =>
      current.includes(questionId) ? current : [...current, questionId],
    );
  };

  return {
    ...data,
    existingQuiz,
    title,
    setTitle,
    selectedIds,
    setSelectedIds,
    watchPercentage,
    setWatchPercentage,
    canSubmit,
    saveQuiz,
    submitQuiz,
    addSelectedQuestion,
    canEdit: capabilities.assessmentTargeting && capabilities.quizThresholdSetting,
  };
}
