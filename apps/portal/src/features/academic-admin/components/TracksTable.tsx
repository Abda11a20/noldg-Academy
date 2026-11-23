import type { AcademicTrack } from "@noldg/api/contracts/admin";
import { DataTable, ErrorState, Skeleton } from "@noldg/ui";
import type { DataColumn, ErrorStateProps } from "@noldg/ui";
import { TrackRowActions } from "./TrackRowActions";

export interface TracksTableProps {
  label: string;
  emptyLabel: string;
  loading: boolean;
  rows: readonly AcademicTrack[];
  columns: readonly DataColumn<AcademicTrack>[];
  error?: ErrorStateProps | undefined;
  editLabel: string;
  disableLabel: string;
  enableLabel: string;
  onEdit: (row: AcademicTrack) => void;
  onToggle: (row: AcademicTrack) => void;
}

/** Renders loading, empty, error, desktop table, and mobile cards for tracks.
 * @param props Presentational list state and track action events.
 */
export function TracksTable({
  label,
  emptyLabel,
  loading,
  rows,
  columns,
  error,
  editLabel,
  disableLabel,
  enableLabel,
  onEdit,
  onToggle,
}: TracksTableProps) {
  return (
    <DataTable
      label={label}
      actionColumnLabel={editLabel}
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      loading={loading}
      loadingContent={<Skeleton className="h-32" />}
      emptyContent={<p>{emptyLabel}</p>}
      {...(error ? { errorContent: <ErrorState {...error} /> } : {})}
      rowActions={(row) => (
        <TrackRowActions
          row={row}
          editLabel={editLabel}
          disableLabel={disableLabel}
          enableLabel={enableLabel}
          onEdit={() => onEdit(row)}
          onToggle={() => onToggle(row)}
        />
      )}
    />
  );
}
