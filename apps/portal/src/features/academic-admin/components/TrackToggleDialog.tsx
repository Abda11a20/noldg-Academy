import type { AcademicTrack } from "@noldg/api/contracts/admin";
import { ConfirmDialog } from "@noldg/ui";

interface TrackToggleDialogProps {
  track?: AcademicTrack | undefined;
  closeLabel: string;
  confirmLabel: string;
  cancelLabel: string;
  disableLabel: string;
  enableLabel: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/** Confirms enabling or disabling an academic track.
 * @param props Optional target track, translated labels, and confirmation events.
 */
export function TrackToggleDialog({
  track,
  closeLabel,
  confirmLabel,
  cancelLabel,
  disableLabel,
  enableLabel,
  onOpenChange,
  onConfirm,
}: TrackToggleDialogProps) {
  const title = track?.active ? disableLabel : enableLabel;
  return (
    <ConfirmDialog
      open={Boolean(track)}
      onOpenChange={onOpenChange}
      title={title}
      closeLabel={closeLabel}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      onConfirm={onConfirm}
    />
  );
}
