import { useMemo, useState } from "react";
import type { UserSummary } from "@noldg/api/contracts/admin";
import type { DataColumn, ErrorStateProps } from "@noldg/ui";
import { AppError } from "@noldg/api/errors";
import { useTranslation } from "react-i18next";
import { useListUrlState } from "../../../shared/navigation/useListUrlState";
import { useTeacherAccountList, useUpdateTeacherStatus } from "./useTeacherAdministration";

function accountListError(
  error: unknown,
  forbiddenTitle: string,
  forbiddenBody: string,
  unavailableTitle: string,
  unavailableBody: string,
  retryLabel: string,
  retry: () => void,
): ErrorStateProps | undefined {
  if (!error) return undefined;
  const forbidden = error instanceof AppError && error.status === 403;
  return {
    title: forbidden ? forbiddenTitle : unavailableTitle,
    description: forbidden ? forbiddenBody : unavailableBody,
    retryLabel,
    onRetry: retry,
  };
}

/** Owns the teacher account list and status mutation state.
 * @param status Account view to query.
 * @returns View data, selection, query and localized labels.
 */
export function useTeacherAccountsPanel(status: "active" | "suspended") {
  const { t } = useTranslation("admin");
  const listState = useListUrlState();
  const list = useTeacherAccountList(listState.state, status);
  const updateStatus = useUpdateTeacherStatus();
  const [selected, setSelected] = useState<UserSummary>();
  const columns = useMemo<readonly DataColumn<UserSummary>[]>(
    () => [
      { id: "name", header: t("teachers.fields.name"), render: (row) => row.name },
      { id: "email", header: t("teachers.fields.email"), render: (row) => row.email },
      {
        id: "status",
        header: t("teachers.fields.status"),
        render: (row) =>
          t(row.status === "active" ? "teachers.statuses.active" : "teachers.statuses.suspended"),
      },
    ],
    [t],
  );
  const nextStatus: "active" | "suspended" = status === "active" ? "suspended" : "active";
  const error = accountListError(
    list.error,
    t("teachers.states.forbiddenTitle"),
    t("teachers.states.forbiddenBody"),
    t("teachers.states.unavailableTitle"),
    t("teachers.states.unavailableBody"),
    t("teachers.actions.retry"),
    () => void list.refetch(),
  );
  const confirmStatus = (reason: string) => {
    if (!selected) return;
    updateStatus.mutate(
      { id: selected.id, status: nextStatus, reason },
      { onSuccess: () => setSelected(undefined) },
    );
  };
  return {
    t,
    listState,
    list,
    updateStatus,
    selected,
    setSelected,
    columns,
    nextStatus,
    error,
    confirmStatus,
  };
}
