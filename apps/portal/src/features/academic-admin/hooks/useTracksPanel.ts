import { useMemo, useState } from "react";
import { AppError } from "@noldg/api/errors";
import { ACADEMIC_STAGES, ACADEMIC_SYSTEMS } from "@noldg/api/constants/admin";
import type { AcademicTrack } from "@noldg/api/contracts/admin";
import { useToast, type DataColumn, type ErrorStateProps } from "@noldg/ui";
import { useTranslation } from "react-i18next";
import { useListUrlState } from "../../../shared/navigation/useListUrlState";
import { useAcademicQueries } from "./useAcademicQueries";
import { useAcademicMutations } from "./useAcademicMutations";
import { ACADEMIC_STAGE_LABEL_KEYS, ACADEMIC_SYSTEM_LABEL_KEYS } from "../translation-keys";

function translateFilterOptions<T extends string>(
  values: readonly T[],
  translate: (value: T) => string,
  allLabel: string,
) {
  return [
    { value: "", label: allLabel },
    ...values.map((value) => ({ value, label: translate(value) })),
  ];
}

function getSafeError(
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
  const unavailable = error instanceof AppError && error.status === 501;
  if (forbidden) return { title: forbiddenTitle, description: forbiddenBody };
  return {
    title: unavailableTitle,
    description: unavailableBody,
    ...(unavailable ? {} : { retryLabel, onRetry: retry }),
  };
}

/** Owns URL state, query data, and mutations for academic track editing.
 * @returns Render data and actions for the tracks panel.
 */
export function useTracksPanel() {
  const { t } = useTranslation("admin");
  const { notify } = useToast();
  const list = useListUrlState();
  const { tracks } = useAcademicQueries(list.state);
  const mutations = useAcademicMutations();
  const [editing, setEditing] = useState<AcademicTrack>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirming, setConfirming] = useState<AcademicTrack>();
  const columns = useMemo<readonly DataColumn<AcademicTrack>[]>(
    () => [
      { id: "name", header: t("academic.fields.name"), render: (row) => row.name },
      {
        id: "system",
        header: t("academic.fields.system"),
        render: (row) => t(ACADEMIC_SYSTEM_LABEL_KEYS[row.system]),
      },
      {
        id: "stage",
        header: t("academic.fields.stage"),
        render: (row) => t(ACADEMIC_STAGE_LABEL_KEYS[row.stage]),
      },
      { id: "grade", header: t("academic.fields.grade"), render: (row) => String(row.grade) },
      {
        id: "active",
        header: t("academic.fields.active"),
        render: (row) => t(row.active ? "common.enabled" : "common.disabled"),
      },
    ],
    [t],
  );
  const systemOptions = translateFilterOptions(
    ACADEMIC_SYSTEMS,
    (system) => t(ACADEMIC_SYSTEM_LABEL_KEYS[system]),
    t("academic.filters.all"),
  );
  const stageOptions = translateFilterOptions(
    ACADEMIC_STAGES,
    (stage) => t(ACADEMIC_STAGE_LABEL_KEYS[stage]),
    t("academic.filters.all"),
  );
  const activeOptions = [
    { value: "", label: t("academic.filters.all") },
    { value: "true", label: t("common.enabled") },
    { value: "false", label: t("common.disabled") },
  ];
  const save = (fields: Pick<AcademicTrack, "system" | "stage" | "grade" | "name">) => {
    const onSuccess = () => {
      setDialogOpen(false);
      setEditing(undefined);
      notify({ title: t("academic.title"), tone: "success" });
    };
    if (editing) mutations.updateTrackMutation.mutate({ id: editing.id, fields }, { onSuccess });
    else mutations.createTrackMutation.mutate(fields, { onSuccess });
  };
  const confirmChange = () => {
    if (!confirming) return;
    mutations.updateTrackMutation.mutate(
      { id: confirming.id, fields: { active: !confirming.active } },
      { onSuccess: () => setConfirming(undefined) },
    );
  };
  const error = getSafeError(
    tracks.error,
    t("academic.states.forbiddenTitle"),
    t("academic.states.forbiddenBody"),
    t("academic.states.unavailableTitle"),
    t("academic.states.unavailableBody"),
    t("teachers.actions.retry"),
    () => void tracks.refetch(),
  );
  return {
    t,
    list,
    tracks,
    mutations,
    editing,
    setEditing,
    dialogOpen,
    setDialogOpen,
    confirming,
    setConfirming,
    columns,
    systemOptions,
    stageOptions,
    activeOptions,
    save,
    confirmChange,
    error,
  };
}
