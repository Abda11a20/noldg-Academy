import { useTranslation } from "react-i18next";
import type { BrowseTeacherList } from "@noldg/api/contracts/browse";
import { EmptyState, ErrorState, Pagination, Skeleton } from "@noldg/ui";
import { isForbiddenError } from "../../../shared/errors/isForbiddenError";
import { TeacherCard } from "./TeacherCard";
import { STUDENT_BROWSE_PAGE_SIZE_OPTIONS } from "../constants";

interface TeacherListResultsProps {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  data: BrowseTeacherList | undefined;
  returnSearch: string;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

/** Renders the teacher list loading, error, empty, and paginated result states. */
export function TeacherListResults(props: TeacherListResultsProps) {
  const { t } = useTranslation(["browse", "common"]);
  if (props.isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label={t("loadingTeachers")}>
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton className="h-40" key={index} />
        ))}
      </div>
    );
  }
  if (props.isError) {
    if (isForbiddenError(props.error))
      return <ErrorState title={t("forbiddenTitle")} description={t("forbiddenDescription")} />;
    return (
      <ErrorState
        title={t("loadErrorTitle")}
        description={t("loadErrorDescription")}
        retryLabel={t("common:retry")}
        onRetry={props.onRetry}
      />
    );
  }
  if (props.data?.items.length === 0)
    return <EmptyState icon="users" title={t("emptyTitle")} description={t("emptyDescription")} />;
  if (!props.data?.items.length) return null;

  return (
    <>
      <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
        {props.data.items.map((teacher) => (
          <li key={teacher.id}>
            <TeacherCard teacher={teacher} returnSearch={props.returnSearch} />
          </li>
        ))}
      </ul>
      <Pagination
        page={props.data.page}
        pageSize={props.data.pageSize}
        total={props.data.total}
        pageLabel={t("common:pagination.label")}
        pageSizeLabel={t("common:pagination.pageSize")}
        pageSizePlaceholder={t("common:pagination.pageSize")}
        previousLabel={t("common:pagination.previous")}
        nextLabel={t("common:pagination.next")}
        pageSizeOptions={STUDENT_BROWSE_PAGE_SIZE_OPTIONS}
        pageStatus={(page, count) => t("common:pagination.status", { page, pageCount: count })}
        onPageChange={props.onPageChange}
        onPageSizeChange={props.onPageSizeChange}
      />
    </>
  );
}
