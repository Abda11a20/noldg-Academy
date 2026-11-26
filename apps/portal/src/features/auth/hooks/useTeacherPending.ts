import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyTeacherApplication, getTeacherOfferingCatalog } from "@noldg/api/endpoints/admin";
import type { AuthUser } from "@noldg/api/contracts/auth";
import { setAuthenticatedUser } from "../../../shared/auth/auth-store";

/** Loads a teacher's application summary and offers a refresh event for resubmission.
 * @param user Current authenticated teacher, or null before session initialization.
 */
export function useTeacherPending(user: AuthUser | null) {
  const queryClient = useQueryClient();
  const application = useQuery({
    queryKey: ["auth", "teacher-application", user?.id ?? "anonymous"],
    queryFn: () =>
      getMyTeacherApplication({
        id: user?.id ?? "",
        name: user?.name ?? "",
        email: user?.email ?? "",
      }),
    enabled: Boolean(user?.role === "teacher"),
    retry: false,
  });
  const catalog = useQuery({
    queryKey: ["academic", "teacher-offering-catalog"],
    queryFn: getTeacherOfferingCatalog,
    enabled: Boolean(user?.role === "teacher"),
    retry: false,
  });
  const refresh = async () => {
    const refreshed = await application.refetch();
    if (user && refreshed.data?.status === "pending") {
      setAuthenticatedUser({
        ...user,
        applicationStatus: "pending",
        ...(refreshed.data.rejectionReason
          ? { rejectionReason: refreshed.data.rejectionReason }
          : {}),
      });
    }
    await Promise.all([queryClient.invalidateQueries({ queryKey: ["auth", "me"] })]);
  };
  return {
    profile: application.data,
    catalog: catalog.data,
    loading: application.isLoading || catalog.isLoading,
    error: application.error ?? catalog.error,
    refresh,
  };
}
