import { ADMIN_LIST_PAGE_SIZES } from "@noldg/api/constants/admin";
import { Pagination } from "@noldg/ui";

interface ApplicationPaginationProps {
  data?: { page: number; pageSize: number; total: number } | undefined;
  labels: { page: string; pageSize: string; placeholder: string; previous: string; next: string };
  pageStatus: (page: number, count: number) => string;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}

/** Renders pagination controls when teacher application totals are available.
 * @param props Optional query result, translated labels, and state events.
 */
export function ApplicationPagination({
  data,
  labels,
  pageStatus,
  onPage,
  onPageSize,
}: ApplicationPaginationProps) {
  if (!data) return null;
  return (
    <Pagination
      page={data.page}
      pageSize={data.pageSize}
      total={data.total}
      pageLabel={labels.page}
      pageSizeLabel={labels.pageSize}
      pageSizePlaceholder={labels.placeholder}
      previousLabel={labels.previous}
      nextLabel={labels.next}
      pageStatus={pageStatus}
      pageSizeOptions={ADMIN_LIST_PAGE_SIZES}
      onPageChange={onPage}
      onPageSizeChange={onPageSize}
    />
  );
}
