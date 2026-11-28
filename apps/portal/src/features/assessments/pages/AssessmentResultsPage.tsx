import { useMemo } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Alert, Skeleton } from "@noldg/ui";
import { capabilities } from "@noldg/api/config/capabilities";
import { AppError } from "@noldg/api/errors";
import { useListUrlState } from "../../../shared/navigation/useListUrlState";
import { useAssessmentResults } from "../hooks/useAssessmentResults";
import { AssessmentResultsContent } from "../components/AssessmentResultsContent";

function resolveResultsError(
  error: unknown,
  t: (key: "assessmentNotFound" | "loadError") => string,
  tErrors: (key: "forbidden") => string,
): string {
  if (error instanceof AppError && error.status === 403) return tErrors("forbidden");
  if (error instanceof AppError && error.status === 404) return t("assessmentNotFound");
  return t("loadError");
}

/** Displays paged teacher results and server-computed summary metrics.
 * @returns Loading, permission, error, empty, or assessment result state.
 */
export function AssessmentResultsPage() {
  const { t, i18n } = useTranslation("assessments");
  const { t: tErrors } = useTranslation("errors");
  const { courseId = "", assessmentId = "" } = useParams();
  const listState = useListUrlState();
  const suspicious = listState.state.filters.suspicious === "true";
  const query = useMemo(
    () => ({
      page: listState.state.page,
      pageSize: listState.state.pageSize,
      ...(listState.state.search ? { search: listState.state.search } : {}),
      ...(suspicious ? { suspicious: true } : {}),
    }),
    [listState.state.page, listState.state.pageSize, listState.state.search, suspicious],
  );
  const results = useAssessmentResults(assessmentId, query, capabilities.assessmentResultsApi);
  if (!capabilities.assessmentResultsApi)
    return <Alert tone="info">{t("resultsUnavailable")}</Alert>;
  if (results.isPending) return <Skeleton height="lg" />;
  if (results.isError) {
    return (
      <Alert tone="danger" role="alert">
        {resolveResultsError(results.error, t, tErrors)}
      </Alert>
    );
  }
  return (
    <AssessmentResultsContent
      courseId={courseId}
      assessmentId={assessmentId}
      data={results.data}
      language={i18n.language}
      search={listState.state.search}
      suspicious={suspicious}
      filters={listState.state.filters}
      onSearchChange={listState.setSearch}
      onFiltersChange={listState.setFilters}
      onPageChange={listState.setPage}
      onPageSizeChange={listState.setPageSize}
    />
  );
}
