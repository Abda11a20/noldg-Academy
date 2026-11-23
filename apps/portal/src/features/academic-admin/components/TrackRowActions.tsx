import type { AcademicTrack } from "@noldg/api/contracts/admin";
import { Button } from "@noldg/ui";

export interface TrackRowActionsProps {
  row: AcademicTrack;
  editLabel: string;
  disableLabel: string;
  enableLabel: string;
  onEdit: () => void;
  onToggle: () => void;
}

/** Renders the edit and enable/disable actions for one track.
 * @param props Record and translated labels with callbacks.
 */
export function TrackRowActions({
  row,
  editLabel,
  disableLabel,
  enableLabel,
  onEdit,
  onToggle,
}: TrackRowActionsProps) {
  const toggleLabel = row.active ? disableLabel : enableLabel;
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="ghost" onClick={onEdit}>
        {editLabel}
      </Button>
      <Button size="sm" variant="secondary" onClick={onToggle}>
        {toggleLabel}
      </Button>
    </div>
  );
}
