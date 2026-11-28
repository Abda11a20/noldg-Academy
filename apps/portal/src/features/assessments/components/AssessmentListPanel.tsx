import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import type { Assessment, AssessmentType } from "@noldg/api/contracts/assessments";
import { Alert, Button, DataTable, EmptyState, Heading, Skeleton } from "@noldg/ui";
import { capabilities } from "@noldg/api/config/capabilities";
import { useAssessments } from "../hooks/useAssessments";
import { getTeacherAssessmentNewPath, getTeacherAssessmentResultsPath } from "../routes";

interface AssessmentListPanelProps {
  courseId: string;
  type: AssessmentType;
}

/** Renders a course assessment list and its server-backed lifecycle actions.
 * @param props Course and assessment category selected by the teacher.
 */
export function AssessmentListPanel({ courseId, type }: AssessmentListPanelProps) {
  const { t } = useTranslation(["assessments", "errors"]);
  const navigate = useNavigate();
  const data = useAssessments(courseId);
  const items = useMemo(
    () => data.assessments.data?.items.filter((assessment) => assessment.type === type) ?? [],
    [data.assessments.data?.items, type],
  );
  if (data.assessments.isPending) return <Skeleton height="lg" />;
  const isError = data.assessments.isError;
  const columns = [
    { id: "title", header: t("titleColumn"), render: (row: Assessment) => row.title },
    {
      id: "status",
      header: t("statusColumn"),
      render: (row: Assessment) => t(`status.${row.status}`),
    },
    {
      id: "window",
      header: t("windowColumn"),
      render: (row: Assessment) =>
        row.windowStart && row.windowEnd ? `${row.windowStart} – ${row.windowEnd}` : t("noWindow"),
    },
    {
      id: "questions",
      header: t("questionsColumn"),
      render: (row: Assessment) => row.questionIds.length,
    },
    { id: "attempts", header: t("attemptsColumn"), render: (row: Assessment) => row.attemptCount },
  ];
  return (
    <section className="space-y-4">
      {!capabilities.assessmentTargeting ? <Alert tone="info">{t("liveUnavailable")}</Alert> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Heading level={2}>{t(type === "exam" ? "examsTitle" : "homeworkTitle")}</Heading>
        <Button
          onClick={() =>
            navigate(
              getTeacherAssessmentNewPath(courseId, type === "homework" ? "homework" : "exam"),
            )
          }
        >
          {t("create", { type: t(type) })}
        </Button>
      </div>
      <DataTable
        label={t("listLabel")}
        columns={columns}
        rows={items}
        getRowKey={(row) => row.id}
        loading={false}
        loadingContent={<Skeleton height="md" />}
        emptyContent={
          <EmptyState icon="file" title={t("emptyTitle")} description={t("emptyDescription")} />
        }
        errorContent={isError ? <Alert tone="danger">{t("loadError")}</Alert> : undefined}
        rowActions={(row) => (
          <div className="flex flex-wrap gap-2">
            {row.status === "draft" ? (
              <Button size="sm" onClick={() => data.publish.mutate(row.id)}>
                {t("publish")}
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => data.close.mutate(row.id)}>
                {t("close")}
              </Button>
            )}
            {row.status !== "archived" ? (
              <Button size="sm" variant="ghost" onClick={() => data.archive.mutate(row.id)}>
                {t("archive")}
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate(getTeacherAssessmentResultsPath(courseId, row.id))}
            >
              {t("results")}
            </Button>
          </div>
        )}
        actionColumnLabel={t("actions")}
      />
    </section>
  );
}
