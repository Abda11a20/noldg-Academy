import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AssessmentInput } from "@noldg/api/contracts/assessments";
import { createAssessment, publishAssessment } from "@noldg/api/endpoints/assessments";
import { capabilities } from "@noldg/api/config/capabilities";
import { useApiErrorToast } from "../../../shared/errors/useApiErrorToast";
import { DEFAULT_ASSESSMENT_SHOW_RESULTS, DEFAULT_QUIZ_WATCH_PERCENTAGE } from "../constants";
import { useAssessments } from "./useAssessments";
import { assessmentQueryKeys } from "../assessment-query-keys";

/** Loads a lesson quiz and submits a target quiz with server-owned threshold defaults.
 * @param courseId Teacher course identifier.
 * @param lessonId Existing lesson identifier.
 */
export function useLessonQuiz(courseId: string, lessonId: string) {
  const queryClient = useQueryClient();
  const reportError = useApiErrorToast();
  const data = useAssessments(courseId);
  const [title, setTitle] = useState("");
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const existingQuiz = useMemo(
    () =>
      data.assessments.data?.items.find(
        (item) => item.type === "quiz" && item.lessonId === lessonId,
      ),
    [data.assessments.data?.items, lessonId],
  );
  const createQuiz = useMutation({
    mutationFn: async (values: { title: string; questionIds: readonly string[] }) => {
      const input: AssessmentInput = {
        type: "quiz",
        courseId,
        lessonId,
        title: values.title.trim(),
        questionIds: [...values.questionIds],
        shuffle: true,
        showResults: DEFAULT_ASSESSMENT_SHOW_RESULTS,
        targetMode: "all_course_students",
        studentIds: [],
        requiredWatchPercentage: DEFAULT_QUIZ_WATCH_PERCENTAGE,
        maxAttempts: 1,
      };
      const created = await createAssessment(input);
      try {
        return await publishAssessment(created.id);
      } finally {
        await queryClient.invalidateQueries({ queryKey: assessmentQueryKeys.lists() });
      }
    },
    onError: reportError,
  });
  return {
    ...data,
    existingQuiz,
    title,
    setTitle,
    selectedIds,
    setSelectedIds,
    createQuiz,
    canEdit: capabilities.assessmentTargeting && capabilities.quizThresholdSetting,
  };
}
