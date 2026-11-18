import type { ReactNode } from "react";
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
}
/** Displays caller-supplied rows, state content, and sort indicators without data logic. @param props Columns, rows, identity, and state slots. */
export function DataTable<Row>({
  label,
  columns,
  rows,
  getRowKey,
  loading = false,
  loadingContent,
  emptyContent,
  errorContent,
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
                  {column.header}
                </th>
              ))}
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
          </article>
        ))}
      </div>
    </>
  );
}
