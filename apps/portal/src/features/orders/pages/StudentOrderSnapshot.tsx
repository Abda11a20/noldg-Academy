import { useState } from "react";
import { Badge, Button, Card, CardBody, ConfirmDialog, Text } from "@noldg/ui";
import type { OrderSummary } from "@noldg/api/contracts/orders";
import { useTranslation } from "react-i18next";
import { formatMoney } from "../../../shared/i18n/formatting";
import { formatCairoDateTime } from "../../../shared/time/time";
import { buildWhatsappLink } from "../../../shared/whatsapp/whatsapp";
import { OrderTimeline } from "./OrderTimeline";

interface StudentOrderSnapshotProps {
  order: OrderSummary;
  supportNumber: string | null;
  onCancel: () => Promise<void>;
}

function buildOrderWhatsapp(supportNumber: string | null, message: string) {
  if (!supportNumber) return null;
  return buildWhatsappLink(supportNumber, message);
}

/** Presents a student's order snapshot and allows cancellation while payment is pending.
 * @param props Order details and cancellation request.
 */
export function StudentOrderSnapshot(props: StudentOrderSnapshotProps): React.ReactElement {
  const { t, i18n } = useTranslation("orders");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const order = props.order;
  const whatsapp = buildOrderWhatsapp(
    props.supportNumber,
    t("whatsappMessage", {
      orderNumber: order.orderNumber,
      productName: order.product.name,
      amount: formatMoney(order.priceSnapshot.amount),
      senderNumber: order.senderRef ?? "",
    }),
  );
  return (
    <>
      <Card>
        <CardBody className="space-y-3">
          <Text className="font-bold">{order.orderNumber}</Text>
          <Badge tone="primary">{t(`status.${order.status}`)}</Badge>
          <Text>{order.product.name}</Text>
          <Text>{t("priceNow", { price: formatMoney(order.priceSnapshot.amount) })}</Text>
          <Text>{t("fullPrice", { price: formatMoney(order.priceSnapshot.fullPrice) })}</Text>
          {order.priceSnapshot.announcedCount !== undefined &&
          order.priceSnapshot.remainingCount !== undefined ? (
            <Text>
              {t("counts", {
                announced: order.priceSnapshot.announcedCount,
                remaining: order.priceSnapshot.remainingCount,
              })}
            </Text>
          ) : null}
          {order.createdAt ? (
            <Text>{formatCairoDateTime(order.createdAt, i18n.language)}</Text>
          ) : null}
          {order.paymentMethod ? <Text>{t(`methods.${order.paymentMethod}`)}</Text> : null}
          {order.senderRef ? (
            <Text>{t("senderRefWithValue", { value: order.senderRef })}</Text>
          ) : null}
          {order.rejectionReason ? (
            <Text>{t("rejectionReason", { reason: order.rejectionReason })}</Text>
          ) : null}
          <OrderTimeline order={order} />
          {whatsapp ? (
            <Button onClick={() => window.open(whatsapp, "_blank", "noopener,noreferrer")}>
              {t("whatsapp")}
            </Button>
          ) : null}
          {order.status === "awaiting_payment" ? (
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              {t("cancel")}
            </Button>
          ) : null}
        </CardBody>
      </Card>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("cancelConfirmTitle")}
        description={t("cancelConfirmDescription")}
        closeLabel={t("back")}
        cancelLabel={t("back")}
        confirmLabel={t("confirmCancel")}
        onConfirm={() => {
          void props.onCancel().then(() => setConfirmOpen(false));
        }}
      />
    </>
  );
}
