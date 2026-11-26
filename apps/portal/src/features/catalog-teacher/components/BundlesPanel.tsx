import { useTranslation } from "react-i18next";
import { capabilities } from "@noldg/api/config/capabilities";
import { Alert, Button, ConfirmDialog, Heading } from "@noldg/ui";
import { BundleEditorDialog } from "./BundleEditorDialog";
import { BundleListTable } from "./BundleListTable";
import { useBundlePanelState } from "../hooks/useBundlePanelState";

function closeEditor(
  open: boolean,
  setOpen: (open: boolean) => void,
  clearEditing: () => void,
): void {
  setOpen(open);
  if (!open) clearEditing();
}

/** Composes the bundle list, editor, and archive confirmation. @param props Course identifier. */
export function BundlesPanel({ courseId }: { courseId: string }) {
  const { t } = useTranslation(["catalog"]);
  const state = useBundlePanelState(courseId);
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Heading level={2}>{t("catalog:bundlesTitle")}</Heading>
        <Button onClick={state.openCreate}>{t("catalog:createBundle")}</Button>
      </div>
      {!capabilities.bundleLessons ? (
        <Alert tone="info">{t("catalog:lessonSelectionUnavailable")}</Alert>
      ) : null}
      <BundleListTable
        error={state.products.error}
        isError={state.products.isError}
        loading={state.products.isPending}
        onArchive={state.setArchiveTarget}
        onEdit={state.openEdit}
        onRetry={() => void state.products.refetch()}
        rows={state.pricedRows}
      />
      <BundleEditorDialog
        editing={state.editing}
        form={state.form}
        lessons={state.lessons}
        onFormChange={state.setForm}
        onOpenChange={(open) =>
          closeEditor(open, state.setDialogOpen, () => state.setEditing(undefined))
        }
        onSave={state.save}
        onSearchChange={state.setLessonSearch}
        onToggleLesson={state.toggleLesson}
        open={state.dialogOpen}
        pending={state.isPending}
        search={state.lessonSearch}
        valid={state.isValid}
      />
      <ConfirmDialog
        cancelLabel={t("catalog:cancel")}
        closeLabel={t("catalog:cancel")}
        confirmLabel={t("catalog:archiveBundle")}
        description={t("catalog:archiveBundleDescription")}
        onConfirm={state.archive}
        onOpenChange={(open) => {
          if (!open) state.setArchiveTarget(undefined);
        }}
        open={Boolean(state.archiveTarget)}
        title={t("catalog:archiveBundle")}
      />
    </section>
  );
}
