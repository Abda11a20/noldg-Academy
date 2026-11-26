import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { AppError } from "@noldg/api/errors";
import { Button, ErrorState, Heading, useToast } from "@noldg/ui";
import { formatMoney } from "../../../shared/i18n/formatting";
import { buildWhatsappLink } from "../../../shared/whatsapp/whatsapp";
import { useCopyValue } from "../hooks/useCopyValue";
import { useApproveOrder, useOrder, useRejectOrder } from "../hooks/useOrders";
import { AdminOrderSnapshot } from "./AdminOrderSnapshot";
import { AdminOrderReviewDialog } from "./AdminOrderReviewDialog";

/** Shows payment evidence to an account manager and requires explicit review confirmation. */
export function AdminOrderDetailPage(): React.ReactElement {
  const { orderId = "" } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("orders");
  const { notify } = useToast();
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const query = useOrder(orderId, true);
  const approve = useApproveOrder();
  const reject = useRejectOrder();
  const { copy } = useCopyValue();
  if (query.isPending)
    return (
      <div aria-busy="true">
        <Heading level={1}>{t("details")}</Heading>
      </div>
    );
  if (query.isError || !query.data) {
    const description =
      query.error instanceof AppError && query.error.status === 403 ? t("403") : t("loadError");
    return (
      <ErrorState
        title={t("loadError")}
        description={description}
        retryLabel={t("retry")}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const order = query.data;
  const whatsapp = order.student?.phone
    ? buildWhatsappLink(
        order.student.phone,
        t("whatsappMessage", {
          orderNumber: order.orderNumber,
          productName: order.product.name,
          amount: formatMoney(order.priceSnapshot.amount),
          senderNumber: order.senderRef ?? "",
        }),
      )
    : null;
  const confirmDecision = (reason?: string): void => {
    const request =
      action === "approve"
        ? approve.mutateAsync(order.id)
        : reject.mutateAsync({ id: order.id, reason: reason ?? "" });
    void request
      .then(() => {
        notify({ title: t("decisionSaved"), tone: "success" });
        setAction(null);
        navigate(-1);
      })
      .catch(() => undefined);
  };

  return (
    <section className="space-y-5">
      <Heading level={1}>{t("detailsWithOrder", { orderNumber: order.orderNumber })}</Heading>
      <AdminOrderSnapshot
        order={order}
        whatsapp={whatsapp}
        onCopy={(value) => void copy(value)}
        onApprove={() => setAction("approve")}
        onReject={() => setAction("reject")}
      />
      <AdminOrderReviewDialog
        action={action}
        onOpenChange={(open) => {
          if (!open) setAction(null);
        }}
        onConfirm={confirmDecision}
      />
      <Button variant="ghost" onClick={() => navigate(-1)}>
        {t("back")}
      </Button>
    </section>
  );
}
