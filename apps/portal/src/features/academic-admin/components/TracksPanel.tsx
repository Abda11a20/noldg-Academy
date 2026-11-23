import type { AcademicTrack } from "@noldg/api/contracts/admin";
import { TrackPagination } from "./TrackPagination";
import { TracksTable } from "./TracksTable";
import { TracksToolbar } from "./TracksToolbar";
import { useTracksPanel } from "../hooks/useTracksPanel";
import { TrackPanelDialogs } from "./TrackPanelDialogs";

function openTrackDialog(
  setEditing: (value: AcademicTrack | undefined) => void,
  setOpen: (value: boolean) => void,
  track?: AcademicTrack,
) {
  setEditing(track);
  setOpen(true);
}

/** Renders the tracks list and its composed filters, table, and dialogs.
 * @returns Academic track management panel.
 */
export function TracksPanel() {
  const state = useTracksPanel();
  const { t, list, tracks } = state;
  const rows = tracks.data?.items ?? [];
  const toolbar = (
    <TracksToolbar
      search={list.state.search}
      searchKey={list.searchKey}
      filters={list.state.filters}
      systemOptions={state.systemOptions}
      stageOptions={state.stageOptions}
      activeOptions={state.activeOptions}
      labels={{
        search: t("academic.filters.search"),
        system: t("academic.filters.system"),
        stage: t("academic.filters.stage"),
        active: t("academic.filters.active"),
        create: t("academic.actions.createTrack"),
        all: t("academic.filters.all"),
      }}
      onSearch={list.setSearch}
      onFilter={(key, value) => list.setFilters({ ...list.state.filters, [key]: value })}
      onCreate={() => openTrackDialog(state.setEditing, state.setDialogOpen)}
    />
  );
  const table = (
    <TracksTable
      label={t("academic.tabs.tracks")}
      emptyLabel={t("academic.states.empty")}
      loading={tracks.isLoading}
      rows={rows}
      columns={state.columns}
      {...(state.error ? { error: state.error } : {})}
      editLabel={t("academic.actions.edit")}
      disableLabel={t("academic.actions.disable")}
      enableLabel={t("academic.actions.enable")}
      onEdit={(row) => openTrackDialog(state.setEditing, state.setDialogOpen, row)}
      onToggle={state.setConfirming}
    />
  );
  const pagination = (
    <TrackPagination
      {...(tracks.data ? { page: tracks.data } : {})}
      labels={{
        page: t("list.pageLabel"),
        pageSize: t("list.pageSize"),
        placeholder: t("list.pageSizePlaceholder"),
        previous: t("list.previous"),
        next: t("list.next"),
      }}
      pageStatus={(page, count) => t("list.pageStatus", { page, count })}
      onPage={list.setPage}
      onPageSize={list.setPageSize}
    />
  );
  const dialogs = (
    <TrackPanelDialogs
      editing={state.editing}
      confirming={state.confirming}
      dialogOpen={state.dialogOpen}
      pending={
        state.mutations.createTrackMutation.isPending ||
        state.mutations.updateTrackMutation.isPending
      }
      setDialogOpen={state.setDialogOpen}
      setConfirming={state.setConfirming}
      onSave={state.save}
      onConfirmChange={state.confirmChange}
    />
  );
  return (
    <div className="space-y-4">
      {toolbar}
      {table}
      {pagination}
      {dialogs}
    </div>
  );
}
