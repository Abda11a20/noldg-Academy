import { Button, DataTable, ErrorState, SearchField, Skeleton } from "@noldg/ui";
import { SubjectFormDialog } from "./SubjectFormDialog";
import { SubjectRowActions } from "./SubjectRowActions";
import { SubjectConfirmationDialog } from "./SubjectConfirmationDialog";
import { useSubjectsPanel } from "../hooks/useSubjectsPanel";
import type { AcademicSubject } from "@noldg/api/contracts/admin";

function openSubjectDialog(
  setEditing: (subject: AcademicSubject | undefined) => void,
  setOpen: (open: boolean) => void,
  subject?: AcademicSubject,
) {
  setEditing(subject);
  setOpen(true);
}

function closeSubjectDialog(open: boolean, close: () => void) {
  if (!open) close();
}

/** Renders a searchable list of subjects with create, edit, and disable actions.
 * @returns Subjects list panel.
 */
export function SubjectsPanel() {
  const state = useSubjectsPanel();
  const { t, list, subjects } = state;
  const error = state.error ? <ErrorState {...state.error} /> : undefined;
  const openCreate = () => openSubjectDialog(state.setEditing, state.setDialogOpen);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <SearchField
          key={list.searchKey}
          defaultValue={list.state.search}
          label={t("academic.filters.search")}
          onChange={(event) => list.setSearch(event.currentTarget.value)}
        />
        <Button onClick={openCreate}>{t("academic.actions.createSubject")}</Button>
      </div>
      <DataTable
        label={t("academic.tabs.subjects")}
        actionColumnLabel={t("academic.actions.edit")}
        columns={state.columns}
        rows={subjects.data?.items ?? []}
        getRowKey={(row) => row.id}
        loading={subjects.isLoading}
        loadingContent={<Skeleton className="h-32" />}
        emptyContent={<p>{t("academic.states.empty")}</p>}
        {...(error ? { errorContent: error } : {})}
        rowActions={(row) => (
          <SubjectRowActions
            subject={row}
            editLabel={t("academic.actions.edit")}
            disableLabel={t("academic.actions.disable")}
            enableLabel={t("academic.actions.enable")}
            onEdit={() => openSubjectDialog(state.setEditing, state.setDialogOpen, row)}
            onToggle={() => state.setConfirming(row)}
          />
        )}
      />
      <SubjectFormDialog
        key={state.editing?.id ?? "new-subject"}
        open={state.dialogOpen}
        {...(state.editing ? { subject: state.editing } : {})}
        pending={
          state.mutations.createSubjectMutation.isPending ||
          state.mutations.updateSubjectMutation.isPending
        }
        onOpenChange={state.setDialogOpen}
        onSave={state.save}
      />
      <SubjectConfirmationDialog
        subject={state.confirming}
        closeLabel={t("common.close")}
        confirmLabel={t("academic.actions.save")}
        cancelLabel={t("academic.actions.cancel")}
        disableLabel={t("academic.actions.disable")}
        enableLabel={t("academic.actions.enable")}
        onOpenChange={(open) => closeSubjectDialog(open, () => state.setConfirming(undefined))}
        onConfirm={state.confirmChange}
      />
    </div>
  );
}
