import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  archiveAssessment,
  closeAssessment,
  createAssessment,
  listCourseAssessments,
  publishAssessment,
  updateAssessment,
} from "@noldg/api/endpoints/assessments";
import { listQuestions } from "@noldg/api/endpoints/questions";
import { QuestionListQuerySchema } from "@noldg/api/contracts/assessments";
import { useApiErrorToast } from "../../../shared/errors/useApiErrorToast";
import { assessmentQueryKeys } from "../assessment-query-keys";

/** Loads course assessment and question data and exposes precise cache-aware mutations.
 * @param courseId Course whose assessments are being managed.
 * @returns Query state and create, update, publish, close, and archive mutations.
 */
export function useAssessments(courseId: string) {
  const client = useQueryClient();
  const reportError = useApiErrorToast();
  const assessments = useQuery({
    queryKey: assessmentQueryKeys.list({ page: 1, pageSize: 100, courseId }),
    queryFn: ({ signal }) => listCourseAssessments(courseId, signal),
  });
  const questionQuery = useMemo(
    () => QuestionListQuerySchema.parse({ page: 1, pageSize: 100, courseId }),
    [courseId],
  );
  const questions = useQuery({
    queryKey: ["question-bank", "list", questionQuery],
    queryFn: ({ signal }) => listQuestions(questionQuery, signal),
  });
  const invalidate = () => client.invalidateQueries({ queryKey: assessmentQueryKeys.lists() });
  return {
    assessments,
    questions,
    create: useMutation({
      mutationFn: createAssessment,
      onSuccess: invalidate,
      onError: reportError,
    }),
    update: useMutation({
      mutationFn: ({
        id,
        input,
      }: Parameters<typeof updateAssessment> extends [string, infer Input]
        ? { id: string; input: Input }
        : never) => updateAssessment(id, input),
      onSuccess: invalidate,
      onError: reportError,
    }),
    publish: useMutation({
      mutationFn: publishAssessment,
      onSuccess: invalidate,
      onError: reportError,
    }),
    close: useMutation({
      mutationFn: closeAssessment,
      onSuccess: invalidate,
      onError: reportError,
    }),
    archive: useMutation({
      mutationFn: archiveAssessment,
      onSuccess: invalidate,
      onError: reportError,
    }),
  };
}
