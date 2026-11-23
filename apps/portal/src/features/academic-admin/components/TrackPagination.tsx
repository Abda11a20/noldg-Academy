import { ADMIN_LIST_PAGE_SIZES } from "@noldg/api/constants/admin";
import { Pagination } from "@noldg/ui";

export interface TrackPaginationProps {
  page?: { page: number; pageSize: number; total: number } | undefined;
  labels: { page: string; pageSize: string; placeholder: string; previous: string; next: string };
  pageStatus: (page: number, count: number) => string;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}

/** Renders pagination when track totals are available.
 * @param props Optional server result, translated labels, and handlers.
 */
export function TrackPagination({
  page,
  labels,
  pageStatus,
  onPage,
  onPageSize,
}: TrackPaginationProps) {
  if (!page) return null;
  return (
    <Pagination
      page={page.page}
      pageSize={page.pageSize}
      total={page.total}
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
