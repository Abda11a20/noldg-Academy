import type { ReactNode } from "react";
import { Button } from "../button/Button";
import { Table } from "./Table";

export interface DataColumn<Row> {
  id: string;
  header: string;
  render: (row: Row) => ReactNode;
  sort?: "ascending" | "descending" | "none";
}
export interface DataTableProps<Row> {
  label: string;
  columns: readonly DataColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row) => string;
  loading?: boolean;
  loadingContent: ReactNode;
  emptyContent: ReactNode;
  errorContent?: ReactNode;
  onSort?: (columnId: string) => void;
  sortLabel?: (columnLabel: string) => string;
  rowActions?: (row: Row) => ReactNode;
  actionColumnLabel?: string;
}

/** Displays supplied table rows, responsive cards, state slots, sorting and row actions.
 * @param props Columns, rows, identity, optional sort/action renderers, and states.
 */
export function DataTable<Row>({
  label,
  columns,
  rows,
  getRowKey,
  loading = false,
  loadingContent,
  emptyContent,
  errorContent,
  onSort,
  sortLabel,
  rowActions,
  actionColumnLabel,
}: DataTableProps<Row>) {
  if (errorContent) return <>{errorContent}</>;
  if (loading) return <>{loadingContent}</>;
  if (rows.length === 0) return <>{emptyContent}</>;
  return (
    <>
      <div className="hidden md:block">
        <Table label={label}>
          <thead className="border-b border-border text-start">
            <tr>
              {columns.map((column) => (
                <th
                  aria-sort={column.sort ?? "none"}
                  className="px-3 py-2 text-start font-semibold text-foreground"
                  key={column.id}
                  scope="col"
                >
                  {onSort && sortLabel ? (
                    <Button
                      aria-label={sortLabel(column.header)}
                      iconEnd="sort"
                      onClick={() => onSort(column.id)}
                      size="sm"
                      variant="ghost"
                    >
                      {column.header}
                    </Button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
              {rowActions ? (
                <th className="px-3 py-2 text-start font-semibold text-foreground" scope="col">
                  <span className="sr-only">{actionColumnLabel ?? label}</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b border-border" key={getRowKey(row)}>
                {columns.map((column) => (
                  <td className="px-3 py-3 text-foreground" key={column.id}>
                    {column.render(row)}
                  </td>
                ))}
                {rowActions ? <td className="px-3 py-3">{rowActions(row)}</td> : null}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <article
            aria-label={label}
            className="rounded-md border border-border bg-surface p-3"
            key={getRowKey(row)}
          >
            <dl className="flex flex-col gap-2">
              {columns.map((column) => (
                <div className="flex justify-between gap-3" key={column.id}>
                  <dt className="text-foreground-muted">{column.header}</dt>
                  <dd className="text-end text-foreground">{column.render(row)}</dd>
                </div>
              ))}
            </dl>
            {rowActions ? <div className="mt-3">{rowActions(row)}</div> : null}
          </article>
        ))}
      </div>
    </>
  );
}
