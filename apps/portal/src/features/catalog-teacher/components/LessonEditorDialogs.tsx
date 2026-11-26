import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@noldg/ui";

interface LessonEditorDialogsProps {
  leaveBlocked: boolean;
  showReplace: boolean;
  onConfirmLeave: () => void;
  onCancelLeave: (open: boolean) => void;
  onConfirmReplace: () => void;
  onCancelReplace: (open: boolean) => void;
}

/** Renders unsaved-change and explicit video-replacement confirmations. @param props Dialog state and event callbacks. */
export function LessonEditorDialogs(props: LessonEditorDialogsProps) {
  const { t } = useTranslation("catalog");
  return (
    <>
      <ConfirmDialog
        cancelLabel={t("stayPage")}
        closeLabel={t("stayPage")}
        confirmLabel={t("leavePage")}
        description={t("unsavedDescription")}
        onConfirm={props.onConfirmLeave}
        onOpenChange={props.onCancelLeave}
        open={props.leaveBlocked}
        title={t("unsavedTitle")}
      />
      <ConfirmDialog
        cancelLabel={t("stayPage")}
        closeLabel={t("stayPage")}
        confirmLabel={t("replaceVideo")}
        onConfirm={props.onConfirmReplace}
        onOpenChange={props.onCancelReplace}
        open={props.showReplace}
        title={t("replaceVideo")}
      />
    </>
  );
}
