import { ADMIN_LIST_PAGE_SIZES } from "@noldg/api/constants/admin";
import { Pagination } from "@noldg/ui";

export interface TeacherAccountPaginationProps {
  data?: { page: number; pageSize: number; total: number } | undefined;
  pageLabel: string;
  pageSizeLabel: string;
  placeholder: string;
  previousLabel: string;
  nextLabel: string;
  pageStatus: (page: number, count: number) => string;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}

/** Renders pagination controls when the account list has loaded.
 * @param props Optional result page, translated labels, and state events.
 */
export function TeacherAccountPagination({
  data,
  pageLabel,
  pageSizeLabel,
  placeholder,
  previousLabel,
  nextLabel,
  pageStatus,
  onPage,
  onPageSize,
}: TeacherAccountPaginationProps) {
  if (!data) return null;
  return (
    <Pagination
      page={data.page}
      pageSize={data.pageSize}
      total={data.total}
      pageLabel={pageLabel}
      pageSizeLabel={pageSizeLabel}
      pageSizePlaceholder={placeholder}
      previousLabel={previousLabel}
      nextLabel={nextLabel}
      pageStatus={pageStatus}
      pageSizeOptions={ADMIN_LIST_PAGE_SIZES}
      onPageChange={onPage}
      onPageSizeChange={onPageSize}
    />
  );
}
