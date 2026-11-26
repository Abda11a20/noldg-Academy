import type { AcademicSubject } from "@noldg/api/contracts/admin";
import { Button } from "@noldg/ui";

export interface SubjectRowActionsProps {
  subject: AcademicSubject;
  editLabel: string;
  disableLabel: string;
  enableLabel: string;
  onEdit: () => void;
  onToggle: () => void;
}

/** Renders edit and active-state controls for one subject.
 * @param props Subject and translated action labels with events.
 */
export function SubjectRowActions({
  subject,
  editLabel,
  disableLabel,
  enableLabel,
  onEdit,
  onToggle,
}: SubjectRowActionsProps) {
  const toggleLabel = subject.active ? disableLabel : enableLabel;
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
