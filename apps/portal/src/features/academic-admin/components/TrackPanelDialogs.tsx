import type { AcademicTrack } from "@noldg/api/contracts/admin";
import { useTranslation } from "react-i18next";
import { TrackFormDialog } from "./TrackFormDialog";
import { TrackToggleDialog } from "./TrackToggleDialog";

interface TrackPanelDialogsProps {
  editing?: AcademicTrack | undefined;
  confirming?: AcademicTrack | undefined;
  dialogOpen: boolean;
  pending: boolean;
  setDialogOpen: (open: boolean) => void;
  setConfirming: (track: AcademicTrack | undefined) => void;
  onSave: (input: {
    system: AcademicTrack["system"];
    stage: AcademicTrack["stage"];
    grade: number;
    name: string;
  }) => void;
  onConfirmChange: () => void;
}

/** Renders track create/edit and enable/disable confirmation dialogs.
 * @param props Dialog state and mutation callbacks from the tracks hook.
 */
export function TrackPanelDialogs({
  editing,
  confirming,
  dialogOpen,
  pending,
  setDialogOpen,
  setConfirming,
  onSave,
  onConfirmChange,
}: TrackPanelDialogsProps) {
  const { t } = useTranslation("admin");
  return (
    <>
      <TrackFormDialog
        key={editing?.id ?? "new-track"}
        open={dialogOpen}
        {...(editing ? { track: editing } : {})}
        pending={pending}
        onOpenChange={setDialogOpen}
        onSave={onSave}
      />
      <TrackToggleDialog
        track={confirming}
        closeLabel={t("common.close")}
        confirmLabel={t("academic.actions.save")}
        cancelLabel={t("academic.actions.cancel")}
        disableLabel={t("academic.actions.disable")}
        enableLabel={t("academic.actions.enable")}
        onOpenChange={(open) => {
          if (!open) setConfirming(undefined);
        }}
        onConfirm={onConfirmChange}
      />
    </>
  );
}
