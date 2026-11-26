import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addTrackSubject,
  createSubject,
  createTrack,
  removeTrackSubject,
  updateSubject,
  updateTrack,
} from "@noldg/api/endpoints/admin";
import type { AcademicSubject, AcademicTrack } from "@noldg/api/contracts/admin";
import { useApiErrorToast } from "../../../shared/errors/useApiErrorToast";
import { academicQueryKeys } from "../academic-query-keys";

/** Provides precise cache invalidation for academic catalog writes.
 * @returns Mutation handlers for tracks, subjects, and their mappings.
 */
export function useAcademicMutations() {
  const queryClient = useQueryClient();
  const reportError = useApiErrorToast();
  const invalidate = async () => queryClient.invalidateQueries({ queryKey: academicQueryKeys.all });
  const onError = (error: Error) => reportError(error);
  const createTrackMutation = useMutation({
    mutationFn: createTrack,
    onSuccess: invalidate,
    onError,
  });
  const updateTrackMutation = useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: Partial<AcademicTrack> }) =>
      updateTrack(id, fields),
    onSuccess: invalidate,
    onError,
  });
  const createSubjectMutation = useMutation({
    mutationFn: createSubject,
    onSuccess: invalidate,
    onError,
  });
  const updateSubjectMutation = useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: Partial<AcademicSubject> }) =>
      updateSubject(id, fields),
    onSuccess: invalidate,
    onError,
  });
  const linkMutation = useMutation({
    mutationFn: ({ trackId, subjectId }: { trackId: string; subjectId: string }) =>
      addTrackSubject(trackId, subjectId),
    onSuccess: invalidate,
    onError,
  });
  const unlinkMutation = useMutation({
    mutationFn: ({ trackId, subjectId }: { trackId: string; subjectId: string }) =>
      removeTrackSubject(trackId, subjectId),
    onSuccess: invalidate,
    onError,
  });
  return {
    createTrackMutation,
    updateTrackMutation,
    createSubjectMutation,
    updateSubjectMutation,
    linkMutation,
    unlinkMutation,
  };
}
