import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { capabilities } from "@noldg/api/config/capabilities";
import type { BrowseTeacherQuery } from "@noldg/api/contracts/browse";
import { Badge, Heading, Text } from "@noldg/ui";
import { useListUrlState } from "../../../shared/navigation/useListUrlState";
import { formatCairoDateTime } from "../../../shared/time/time";
import { BrowseFilters } from "../components/BrowseFilters";
import { StudentTrackSelector } from "../components/StudentTrackSelector";
import { TeacherListResults } from "../components/TeacherListResults";
import { BrowseCapabilityNotice } from "../components/BrowseCapabilityNotice";
import { STUDENT_BROWSE_DEFAULT_PAGE_SIZE } from "../constants";
import { useStudentTrack } from "../hooks/useStudentTrack";
import { useBrowseTeachers } from "../hooks/useBrowseTeachers";

function queryFromState(
  page: number,
  pageSize: number,
  search: string,
  sort: string | undefined,
  filters: Record<string, string>,
  trackId: string | undefined,
): BrowseTeacherQuery {
  return {
    page,
    pageSize,
    q: search,
    sort: sort === "rating" || sort === "priceAsc" || sort === "priceDesc" ? sort : "newest",
    ...(trackId ? { trackId } : {}),
    ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
    ...(filters.minRating ? { minRating: Number(filters.minRating) } : {}),
    ...(filters.hasFreeLessons === "true" ? { hasFreeLessons: true } : {}),
  };
}

/** Renders the URL-backed, server-filtered student teacher list and its request states. */
export function TeachersPage() {
  const { t, i18n } = useTranslation(["browse", "common"]);
  const listState = useListUrlState();
  const { trackId, manual, setTrack } = useStudentTrack();
  const query = useMemo(
    () =>
      queryFromState(
        listState.state.page,
        listState.state.pageSize || STUDENT_BROWSE_DEFAULT_PAGE_SIZE,
        listState.state.search,
        listState.state.sort,
        listState.state.filters,
        trackId,
      ),
    [listState.state, trackId],
  );
  const result = useBrowseTeachers(query);
  const [params] = useSearchParams();
  const setFilter = (key: string, value: string | undefined) => {
    const filters = { ...listState.state.filters };
    if (value) filters[key] = value;
    else delete filters[key];
    listState.setFilters(filters);
  };

  return (
    <section className="flex flex-col gap-5">
      <Heading level={1}>{t("teachersTitle")}</Heading>
      {manual ? (
        <StudentTrackSelector {...(trackId ? { trackId } : {})} onChange={setTrack} />
      ) : null}
      <BrowseCapabilityNotice />
      <BrowseFilters
        search={listState.state.search}
        subjectId={listState.state.filters.subjectId ?? ""}
        minRating={listState.state.filters.minRating ?? ""}
        hasFreeLessons={listState.state.filters.hasFreeLessons === "true"}
        sort={listState.state.sort ?? "newest"}
        onSearch={listState.setSearch}
        onSubject={(value) => setFilter("subjectId", value)}
        onRating={(value) => setFilter("minRating", value)}
        onFreeLessons={(value) => setFilter("hasFreeLessons", value ? "true" : undefined)}
        onSort={(value) => listState.setSort(value)}
      />
      {result.data?.serverNow ? (
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">
            {t("serverTime", { time: formatCairoDateTime(result.data.serverNow, i18n.language) })}
          </Badge>
          {!capabilities.teacherRatings ? (
            <Text size="sm" tone="muted">
              {t("ratingsUnavailable")}
            </Text>
          ) : null}
        </div>
      ) : null}
      <TeacherListResults
        isPending={result.isPending}
        isError={result.isError}
        error={result.error}
        data={result.data}
        returnSearch={params.toString()}
        onRetry={() => void result.refetch()}
        onPageChange={listState.setPage}
        onPageSizeChange={listState.setPageSize}
      />
    </section>
  );
}
