import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import type { Assessment } from "@noldg/api/contracts/assessments";
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Heading,
  Skeleton,
} from "@noldg/ui";
import { capabilities } from "@noldg/api/config/capabilities";
import { isForbiddenError } from "../../../shared/errors/isForbiddenError";
import { formatCairoDateTime } from "../../../shared/time/time";
import { useAssessments } from "../hooks/useAssessments";
import {
  getTeacherAssessmentEditPath,
  getTeacherAssessmentNewPath,
  getTeacherAssessmentResultsPath,
} from "../routes";
import { buildDuplicateAssessmentInput } from "../utils/builder-validation";
import { AssessmentRowActions } from "./AssessmentRowActions";

interface AssessmentListPanelProps {
  courseId: string;
  type: "exam" | "homework";
}

function statusTone(status: Assessment["status"]): "neutral" | "success" | "warning" {
  if (status === "published") return "success";
  if (status === "closed") return "warning";
  return "neutral";
}

function buildColumns(t: TFunction<["assessments", "errors"]>, language: string) {
  return [
    { id: "title", header: t("assessments:titleColumn"), render: (row: Assessment) => row.title },
    {
      id: "status",
      header: t("assessments:statusColumn"),
      render: (row: Assessment) => (
        <Badge tone={statusTone(row.status)}>{t(`assessments:status.${row.status}`)}</Badge>
      ),
    },
    {
      id: "window",
      header: t("assessments:windowColumn"),
      render: (row: Assessment) =>
        row.windowStart && row.windowEnd
          ? `${formatCairoDateTime(row.windowStart, language)} – ${formatCairoDateTime(row.windowEnd, language)}`
          : t("assessments:noWindow"),
    },
    {
      id: "questions",
      header: t("assessments:questionsColumn"),
      render: (row: Assessment) => row.questionIds.length,
    },
    {
      id: "attempts",
      header: t("assessments:attemptsColumn"),
      render: (row: Assessment) => row.attemptCount,
    },
  ];
}

function confirmCopy(
  action: "close" | "archive" | undefined,
  t: TFunction<["assessments", "errors"]>,
) {
  const isClose = action === "close";
  return {
    title: t(isClose ? "assessments:confirmCloseTitle" : "assessments:confirmArchiveTitle"),
    description: t(
      isClose ? "assessments:confirmCloseDescription" : "assessments:confirmArchiveDescription",
    ),
    confirmLabel: t(isClose ? "assessments:close" : "assessments:archive"),
  };
}

/** Renders a course assessment list and its server-backed lifecycle and duplicate actions.
 * @param props Course and assessment category selected by the teacher.
 */
export function AssessmentListPanel({ courseId, type }: AssessmentListPanelProps) {
  const { t, i18n } = useTranslation(["assessments", "errors"]);
  const navigate = useNavigate();
  const data = useAssessments(courseId);
  const [confirmTarget, setConfirmTarget] = useState<{
    action: "close" | "archive";
    assessment: Assessment;
  } | null>(null);
  const items = useMemo(
    () => data.assessments.data?.items.filter((assessment) => assessment.type === type) ?? [],
    [data.assessments.data?.items, type],
  );
  if (data.assessments.isPending) return <Skeleton height="lg" />;
  const errorMessage = isForbiddenError(data.assessments.error)
    ? t("errors:forbidden")
    : t("assessments:loadError");
  const busy = [data.publish, data.close, data.archive, data.create].some((m) => m.isPending);
  const canWrite = capabilities.assessmentTargeting;
  const duplicateAssessment = (row: Assessment) => {
    if (busy) return;
    const copyTitle = t("assessments:duplicateTitle", { title: row.title });
    void data.create
      .mutateAsync(buildDuplicateAssessmentInput(row, copyTitle))
      .then((created) => navigate(getTeacherAssessmentEditPath(courseId, created.id)))
      .catch(() => undefined);
  };
  const confirmAction = () => {
    if (!confirmTarget || busy) return;
    const mutation = confirmTarget.action === "close" ? data.close : data.archive;
    void mutation
      .mutateAsync(confirmTarget.assessment.id)
      .then(() => setConfirmTarget(null))
      .catch(() => setConfirmTarget(null));
  };
  const columns = buildColumns(t, i18n.language);
  const dialog = confirmCopy(confirmTarget?.action, t);
  return (
    <section className="space-y-4">
      {!canWrite ? <Alert tone="info">{t("assessments:liveUnavailable")}</Alert> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Heading level={2}>
          {t(type === "exam" ? "assessments:examsTitle" : "assessments:homeworkTitle")}
        </Heading>
        {canWrite ? (
          <Button onClick={() => navigate(getTeacherAssessmentNewPath(courseId, type))}>
            {t("assessments:create", { type: t(`assessments:${type}`) })}
          </Button>
        ) : null}
      </div>
      <DataTable
        label={t("assessments:listLabel")}
        columns={columns}
        rows={items}
        getRowKey={(row) => row.id}
        loading={false}
        loadingContent={<Skeleton height="md" />}
        emptyContent={
          <EmptyState
            icon="file"
            title={t("assessments:emptyTitle")}
            description={t("assessments:emptyDescription")}
          />
        }
        errorContent={
          data.assessments.isError ? (
            <Alert tone="danger" role="alert">
              {errorMessage}
            </Alert>
          ) : undefined
        }
        rowActions={(row) => (
          <AssessmentRowActions
            row={row}
            busy={busy}
            canWrite={canWrite}
            onEdit={(target) => navigate(getTeacherAssessmentEditPath(courseId, target.id))}
            onPublish={(id) => {
              if (!busy) data.publish.mutate(id);
            }}
            onCloseRequest={(assessment) => setConfirmTarget({ action: "close", assessment })}
            onArchiveRequest={(assessment) => setConfirmTarget({ action: "archive", assessment })}
            onDuplicate={duplicateAssessment}
            onResults={(id) => navigate(getTeacherAssessmentResultsPath(courseId, id))}
          />
        )}
        actionColumnLabel={t("assessments:actions")}
      />
      <ConfirmDialog
        open={Boolean(confirmTarget)}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(null);
        }}
        title={dialog.title}
        description={dialog.description}
        closeLabel={t("assessments:closeDialog")}
        cancelLabel={t("assessments:cancel")}
        confirmLabel={dialog.confirmLabel}
        onConfirm={confirmAction}
      />
    </section>
  );
}
