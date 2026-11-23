import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTeacherApplication,
  listTeacherAccounts,
  listTeacherApplications,
  reviewTeacherApplication,
  updateTeacherAccountStatus,
} from "@noldg/api/endpoints/admin";
import type { ListUrlState } from "@noldg/api/contracts/common";
import type { TeacherApplication } from "@noldg/api/contracts/admin";
import { useApiErrorToast } from "../../../shared/errors/useApiErrorToast";
import { teacherApplicationQueryKeys } from "../teacher-application-query-keys";

/** Loads a paged list of teacher applications with a single normalized query shape.
 * @param state Validated URL list state.
 * @param status Application status filter.
 */
export function useTeacherApplicationList(state: ListUrlState, status: string) {
  return useQuery({
    queryKey: teacherApplicationQueryKeys.applicationList(state, status),
    queryFn: () => listTeacherApplications(state, status),
  });
}

/** Loads one application record for the detail route.
 * @param applicationId Application ID from the route.
 */
export function useTeacherApplication(applicationId: string) {
  return useQuery({
    queryKey: teacherApplicationQueryKeys.application(applicationId),
    queryFn: () => getTeacherApplication(applicationId),
    enabled: Boolean(applicationId),
  });
}

/** Reviews a teacher application and refreshes detail and list caches.
 * @returns Approve and reject mutation.
 */
export function useReviewTeacherApplication() {
  const queryClient = useQueryClient();
  const reportError = useApiErrorToast();
  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: "approved" | "rejected";
      reason?: string;
    }) => reviewTeacherApplication(id, status, reason),
    onSuccess: async (application) => {
      queryClient.setQueryData<TeacherApplication>(
        teacherApplicationQueryKeys.application(application.id),
        application,
      );
      await queryClient.invalidateQueries({ queryKey: teacherApplicationQueryKeys.applications() });
    },
    onError: reportError,
  });
}

/** Loads active or suspended teacher accounts.
 * @param state Validated URL list state.
 * @param status Account status filter.
 */
export function useTeacherAccountList(state: ListUrlState, status: "active" | "suspended") {
  return useQuery({
    queryKey: teacherApplicationQueryKeys.accountList(state, status),
    queryFn: () => listTeacherAccounts(state, status),
  });
}

/** Updates an account and invalidates only teacher account lists.
 * @returns Account status mutation.
 */
export function useUpdateTeacherStatus() {
  const queryClient = useQueryClient();
  const reportError = useApiErrorToast();
  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: "active" | "suspended";
      reason: string;
    }) => updateTeacherAccountStatus(id, status, reason),
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: teacherApplicationQueryKeys.accounts() }),
    onError: reportError,
  });
}
