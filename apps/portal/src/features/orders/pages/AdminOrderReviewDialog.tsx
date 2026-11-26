import { ConfirmDialog } from "@noldg/ui";
import { useTranslation } from "react-i18next";

interface AdminOrderReviewDialogProps {
  action: "approve" | "reject" | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason?: string) => void;
}

/** Confirms the selected order decision and collects a rejection reason when needed.
 * @param props Current action and dialog callbacks.
 */
export function AdminOrderReviewDialog(props: AdminOrderReviewDialogProps): React.ReactElement {
  const { t } = useTranslation("orders");
  const rejecting = props.action === "reject";
  return (
    <ConfirmDialog
      open={props.action !== null}
      onOpenChange={props.onOpenChange}
      title={rejecting ? t("reject") : t("confirmApproveTitle")}
      description={t("confirmApproveDescription")}
      closeLabel={t("back")}
      cancelLabel={t("back")}
      confirmLabel={rejecting ? t("reject") : t("confirmApprove")}
      {...(rejecting
        ? { reason: { id: "order-reject-reason", label: t("rejectReason"), minimumLength: 5 } }
        : {})}
      onConfirm={props.onConfirm}
    />
  );
}
