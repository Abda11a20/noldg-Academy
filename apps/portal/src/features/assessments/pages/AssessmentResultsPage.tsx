import { useMemo } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Alert, Skeleton } from "@noldg/ui";
import { AppError } from "@noldg/api/errors";
import { useListUrlState } from "../../../shared/navigation/useListUrlState";
import { useAssessmentResults } from "../hooks/useAssessmentResults";
import { AssessmentResultsContent } from "../components/AssessmentResultsContent";

function getResultsErrorKey(error: unknown): "forbidden" | "notFound" | "loadError" {
  if (!(error instanceof AppError)) return "loadError";
  if (error.status === 403) return "forbidden";
  if (error.status === 404) return "notFound";
  return "loadError";
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
  const results = useAssessmentResults(assessmentId, query);
  if (results.isPending) return <Skeleton height="lg" />;
  if (results.isError) {
    const errorKey = getResultsErrorKey(results.error);
    return (
      <Alert tone="danger" role="alert">
        {errorKey === "forbidden"
          ? tErrors("forbidden")
          : t(errorKey === "notFound" ? "assessmentNotFound" : "loadError")}
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
