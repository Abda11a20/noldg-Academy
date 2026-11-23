import { Button } from "../button/Button";
import { Select } from "../forms/Select";

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  pageLabel: string;
  pageSizeLabel: string;
  previousLabel: string;
  nextLabel: string;
  pageSizePlaceholder: string;
  pageSizeOptions: readonly number[];
  pageStatus: (page: number, pageCount: number) => string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

/** Renders pagination controls while leaving list state and data fetching to callers.
 * @param props Current page, totals, translated labels, options, and events.
 */
export function Pagination({
  page,
  pageSize,
  total,
  pageLabel,
  pageSizeLabel,
  previousLabel,
  nextLabel,
  pageSizeOptions,
  pageSizePlaceholder,
  pageStatus,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const sizeOptions = pageSizeOptions.map((size) => ({ value: String(size), label: String(size) }));
  return (
    <nav aria-label={pageLabel} className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          size="sm"
          variant="secondary"
        >
          {previousLabel}
        </Button>
        <span aria-live="polite">{pageStatus(page, pageCount)}</span>
        <Button
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          size="sm"
          variant="secondary"
        >
          {nextLabel}
        </Button>
      </div>
      <Select
        id="pagination-page-size"
        label={pageSizeLabel}
        options={sizeOptions}
        value={String(pageSize)}
        placeholder={pageSizePlaceholder}
        onValueChange={(value) => onPageSizeChange(Number(value))}
      />
    </nav>
  );
}
