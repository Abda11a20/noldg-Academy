import { useMemo, useState } from "react";
import { AppError } from "@noldg/api/errors";
import type { AcademicSubject } from "@noldg/api/contracts/admin";
import type { DataColumn, ErrorStateProps } from "@noldg/ui";
import { useToast } from "@noldg/ui";
import { useTranslation } from "react-i18next";
import { useListUrlState } from "../../../shared/navigation/useListUrlState";
import { useAcademicQueries } from "./useAcademicQueries";
import { useAcademicMutations } from "./useAcademicMutations";

function subjectListError(
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

/** Owns subject list state and create, update, and status mutations.
 * @returns Subject list render data and actions.
 */
export function useSubjectsPanel() {
  const { t } = useTranslation("admin");
  const { notify } = useToast();
  const list = useListUrlState();
  const { subjects } = useAcademicQueries(list.state);
  const mutations = useAcademicMutations();
  const [editing, setEditing] = useState<AcademicSubject>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirming, setConfirming] = useState<AcademicSubject>();
  const columns = useMemo<readonly DataColumn<AcademicSubject>[]>(
    () => [
      { id: "name", header: t("academic.fields.name"), render: (row) => row.name },
      {
        id: "active",
        header: t("academic.fields.active"),
        render: (row) => t(row.active ? "common.enabled" : "common.disabled"),
      },
    ],
    [t],
  );
  const save = (name: string) => {
    const onSuccess = () => {
      setDialogOpen(false);
      setEditing(undefined);
      notify({ title: t("academic.title"), tone: "success" });
    };
    if (editing)
      mutations.updateSubjectMutation.mutate({ id: editing.id, fields: { name } }, { onSuccess });
    else mutations.createSubjectMutation.mutate(name, { onSuccess });
  };
  const confirmChange = () => {
    if (!confirming) return;
    mutations.updateSubjectMutation.mutate(
      { id: confirming.id, fields: { active: !confirming.active } },
      { onSuccess: () => setConfirming(undefined) },
    );
  };
  const error = subjectListError(
    subjects.error,
    t("academic.states.forbiddenTitle"),
    t("academic.states.forbiddenBody"),
    t("academic.states.unavailableTitle"),
    t("academic.states.unavailableBody"),
    t("teachers.actions.retry"),
    () => void subjects.refetch(),
  );
  return {
    t,
    list,
    subjects,
    mutations,
    editing,
    setEditing,
    dialogOpen,
    setDialogOpen,
    confirming,
    setConfirming,
    columns,
    save,
    confirmChange,
    error,
  };
}
