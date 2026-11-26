import { useTranslation } from "react-i18next";
import {
  Badge,
  DataTable,
  EmptyState,
  ErrorState,
  Heading,
  Link,
  Pagination,
  Skeleton,
} from "@noldg/ui";
import type { DataColumn } from "@noldg/ui";
import type { CatalogCourse } from "@noldg/api/contracts/catalog";
import { useListUrlState } from "../../../shared/navigation/useListUrlState";
import { useCatalogQueries } from "../hooks/useCatalogQueries";
import { formatNumber } from "../../../shared/i18n/formatting";
import { getTeacherCoursePath } from "../../../shared/navigation/routes";
import { isForbiddenError } from "../../../shared/errors/isForbiddenError";
import { CATALOG_PAGE_SIZE_OPTIONS } from "../constants";

/** Displays approved teacher courses and a localized empty or retry state. */
export function TeacherCoursesPage() {
  const { t } = useTranslation(["catalog", "errors", "common"]);
  const { state, setPage, setPageSize } = useListUrlState();
  const { courses } = useCatalogQueries(undefined, state);
  const columns: DataColumn<CatalogCourse>[] = [
    { id: "subject", header: t("subject"), render: (course) => course.subject.name },
    {
      id: "track",
      header: t("track"),
      render: (course) => `${course.track.name} · ${course.track.grade}`,
    },
    {
      id: "counts",
      header: t("courseCounts"),
      render: (course) =>
        course.lessonCount === undefined
          ? t("countsUnavailable")
          : formatNumber(course.lessonCount),
    },
    {
      id: "status",
      header: t("courseStatus"),
      render: (course) => (
        <Badge>{course.status ? t(course.status) : t("countsUnavailable")}</Badge>
      ),
    },
  ];
  return (
    <section className="space-y-6">
      <Heading level={1}>{t("coursesTitle")}</Heading>
      <DataTable
        columns={columns}
        emptyContent={
          <EmptyState
            description={t("coursesEmptyDescription")}
            icon="book"
            title={t("coursesEmptyTitle")}
          />
        }
        getRowKey={(course) => course.id}
        label={t("coursesTitle")}
        loading={courses.isPending}
        loadingContent={<Skeleton />}
        rows={courses.data?.items ?? []}
        rowActions={(course) => <Link to={getTeacherCoursePath(course.id)}>{t("openCourse")}</Link>}
        errorContent={
          courses.isError ? (
            <ErrorState
              description={
                isForbiddenError(courses.error)
                  ? t("errors:forbidden")
                  : t("catalog:coursesLoadError")
              }
              retryLabel={t("retry")}
              title={
                isForbiddenError(courses.error)
                  ? t("errors:forbidden")
                  : t("catalog:coursesLoadError")
              }
              onRetry={() => void courses.refetch()}
            />
          ) : undefined
        }
      />
      <Pagination
        nextLabel={t("common:pagination.next")}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        page={courses.data?.page ?? state.page}
        pageLabel={t("common:pagination.label")}
        pageSize={state.pageSize}
        pageSizeLabel={t("common:pagination.pageSize")}
        pageSizeOptions={CATALOG_PAGE_SIZE_OPTIONS}
        pageSizePlaceholder={t("common:pagination.pageSize")}
        pageStatus={(page, pageCount) => t("common:pagination.status", { page, pageCount })}
        previousLabel={t("common:pagination.previous")}
        total={courses.data?.total ?? 0}
      />
    </section>
  );
}
