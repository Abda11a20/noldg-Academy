import { useTranslation } from "react-i18next";
import type {
  AssessmentAttemptList,
  AssessmentAttemptSummary,
} from "@noldg/api/contracts/assessments";
import {
  Breadcrumbs,
  Button,
  Checkbox,
  DataTable,
  EmptyState,
  Heading,
  Pagination,
  Skeleton,
  StatCard,
  Text,
  TextField,
} from "@noldg/ui";
import { formatNumber } from "../../../shared/i18n/formatting";
import { formatCairoDateTime } from "../../../shared/time/time";
import { getTeacherCoursePath } from "../../../shared/navigation/routes";
import { getTeacherAssessmentAttemptPath } from "../routes";
import { ASSESSMENT_PAGE_SIZE_OPTIONS } from "../constants";

interface AssessmentResultsContentProps {
  courseId: string;
  assessmentId: string;
  data: AssessmentAttemptList;
  language: string;
  search: string;
  suspicious: boolean;
  filters: Record<string, string>;
  onSearchChange: (search: string) => void;
  onFiltersChange: (filters: Record<string, string>) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

/** Renders result metrics, filters, and server-paged attempt rows.
 * @param props Server result page and URL state controls.
 */
export function AssessmentResultsContent(props: AssessmentResultsContentProps) {
  const { t } = useTranslation("assessments");
  const columns = [
    {
      id: "student",
      header: t("studentColumn"),
      render: (row: AssessmentAttemptSummary) => row.student.name,
    },
    {
      id: "score",
      header: t("scoreColumn"),
      render: (row: AssessmentAttemptSummary) =>
        t("scoreValue", {
          score: row.score === null ? t("notSubmitted") : formatNumber(row.score),
          total: formatNumber(row.total),
        }),
    },
    {
      id: "submitted",
      header: t("submittedColumn"),
      render: (row: AssessmentAttemptSummary) =>
        row.submittedAt ? formatCairoDateTime(row.submittedAt, props.language) : t("notSubmitted"),
    },
    {
      id: "reason",
      header: t("submitReasonColumn"),
      render: (row: AssessmentAttemptSummary) =>
        row.submitReason ? t(`submitReason.${row.submitReason}`) : t("notSubmitted"),
    },
    {
      id: "suspicious",
      header: t("suspiciousColumn"),
      render: (row: AssessmentAttemptSummary) => t(row.suspicious ? "yes" : "no"),
    },
  ];
  const updateSuspicious = (checked: boolean | "indeterminate") =>
    props.onFiltersChange({
      ...props.filters,
      suspicious: checked === true ? "true" : "false",
    });
  return (
    <section className="space-y-5">
      <Breadcrumbs
        label={t("breadcrumbs")}
        items={[
          { label: t("course"), to: getTeacherCoursePath(props.courseId) },
          { label: t("resultsTitle") },
        ]}
      />
      <Heading level={1}>{t("resultsTitle")}</Heading>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("attemptsMetric")} value={formatNumber(props.data.total)} />
        {props.data.summary ? (
          <>
            <StatCard
              label={t("averageScoreMetric")}
              value={
                props.data.summary.averageScore === null
                  ? t("notAvailable")
                  : formatNumber(props.data.summary.averageScore)
              }
            />
            <StatCard
              label={t("manualSubmissionsMetric")}
              value={formatNumber(props.data.summary.manualCount)}
            />
            <StatCard
              label={t("automaticSubmissionsMetric")}
              value={formatNumber(props.data.summary.autoCount)}
              trend={t("suspiciousCount", { count: props.data.summary.suspiciousCount })}
            />
          </>
        ) : null}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <TextField
          id="assessment-result-search"
          label={t("studentSearchLabel")}
          value={props.search}
          onChange={(event) => props.onSearchChange(event.currentTarget.value)}
        />
        <Checkbox
          id="assessment-suspicious-filter"
          label={t("suspiciousFilter")}
          checked={props.suspicious}
          onCheckedChange={updateSuspicious}
        />
      </div>
      <DataTable
        label={t("resultsListLabel")}
        columns={columns}
        rows={props.data.items}
        getRowKey={(row) => row.id}
        loading={false}
        loadingContent={<Skeleton height="md" />}
        emptyContent={
          <EmptyState
            icon="users"
            title={t("noAttemptsTitle")}
            description={t("noAttemptsDescription")}
          />
        }
        rowActions={(row) => (
          <Button
            size="sm"
            variant="secondary"
            to={getTeacherAssessmentAttemptPath(props.courseId, props.assessmentId, row.id)}
          >
            {t("viewAttempt")}
          </Button>
        )}
        actionColumnLabel={t("actions")}
      />
      {props.data.items.length ? (
        <Pagination
          page={props.data.page}
          pageSize={props.data.pageSize}
          total={props.data.total}
          pageLabel={t("paginationLabel")}
          pageSizeLabel={t("pageSizeLabel")}
          previousLabel={t("previousPage")}
          nextLabel={t("nextPage")}
          pageSizePlaceholder={t("pageSizePlaceholder")}
          pageSizeOptions={ASSESSMENT_PAGE_SIZE_OPTIONS}
          pageStatus={(page, pageCount) => t("pageStatus", { page, pageCount })}
          onPageChange={props.onPageChange}
          onPageSizeChange={props.onPageSizeChange}
        />
      ) : null}
      <Text size="sm" tone="muted">
        {t("serverScoresNotice")}
      </Text>
    </section>
  );
}
