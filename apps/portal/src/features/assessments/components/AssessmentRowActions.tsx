import { useTranslation } from "react-i18next";
import type { Assessment } from "@noldg/api/contracts/assessments";
import { Button } from "@noldg/ui";

interface AssessmentRowActionsProps {
  row: Assessment;
  busy: boolean;
  canWrite: boolean;
  onEdit: (row: Assessment) => void;
  onPublish: (id: string) => void;
  onCloseRequest: (row: Assessment) => void;
  onArchiveRequest: (row: Assessment) => void;
  onDuplicate: (row: Assessment) => void;
  onResults: (id: string) => void;
}

/** Renders lifecycle, duplicate, edit, and results buttons for one assessment table row.
 * @param props Assessment row state, mutation busy flag, and action callbacks.
 */
export function AssessmentRowActions({
  row,
  busy,
  canWrite,
  onEdit,
  onPublish,
  onCloseRequest,
  onArchiveRequest,
  onDuplicate,
  onResults,
}: AssessmentRowActionsProps) {
  const { t } = useTranslation("assessments");
  const canEdit = canWrite && (row.status === "draft" || row.status === "published");
  return (
    <div className="flex flex-wrap gap-2">
      {canEdit ? (
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => onEdit(row)}>
          {t("edit")}
        </Button>
      ) : null}
      {row.status === "draft" ? (
        <Button size="sm" disabled={busy} onClick={() => onPublish(row.id)}>
          {t("publish")}
        </Button>
      ) : null}
      {row.status === "published" ? (
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => onCloseRequest(row)}>
          {t("close")}
        </Button>
      ) : null}
      {canWrite && row.status !== "archived" ? (
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => onArchiveRequest(row)}>
          {t("archive")}
        </Button>
      ) : null}
      {canWrite ? (
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => onDuplicate(row)}>
          {t("duplicate")}
        </Button>
      ) : null}
      <Button size="sm" variant="ghost" onClick={() => onResults(row.id)}>
        {t("results")}
      </Button>
    </div>
  );
}
