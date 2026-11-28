import { Button, Card, CardBody, StatusBadge, Text } from "@noldg/ui";
import type { OrderSummary } from "@noldg/api/contracts/orders";
import { formatMoney } from "../../../shared/i18n/formatting";
import { formatCairoDateTime } from "../../../shared/time/time";
import { useTranslation } from "react-i18next";

interface AdminOrderSnapshotProps {
  order: OrderSummary;
  whatsapp: string | null;
  onCopy: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
}

/** Presents the payment and customer details needed to review an order.
 * @param props Order data and review actions.
 */
export function AdminOrderSnapshot(props: AdminOrderSnapshotProps): React.ReactElement {
  const { t, i18n } = useTranslation("orders");
  const order = props.order;
  return (
    <Card>
      <CardBody className="space-y-3">
        <StatusBadge
          status={order.status}
          labels={{
            awaiting_payment: t("status.awaiting_payment"),
            completed: t("status.completed"),
            rejected: t("status.rejected"),
            expired: t("status.expired"),
            cancelled: t("status.cancelled"),
          }}
        />
        <Text>{order.student?.name ?? t("student")}</Text>
        {order.student?.phone ? <Text>{order.student.phone}</Text> : null}
        <Text>{order.teacher.name}</Text>
        <Text>{order.product.name}</Text>
        <Text>{t("priceNow", { price: formatMoney(order.priceSnapshot.amount) })}</Text>
        {order.paymentMethod ? <Text>{t(`methods.${order.paymentMethod}`)}</Text> : null}
        {order.senderRef ? (
          <Button variant="secondary" onClick={() => props.onCopy(order.senderRef ?? "")}>
            {t("copySenderWithValue", { value: order.senderRef })}
          </Button>
        ) : null}
        <Text>{t("confirmApproveDescription")}</Text>
        {order.createdAt ? (
          <Text>{formatCairoDateTime(order.createdAt, i18n.language)}</Text>
        ) : null}
        {props.whatsapp ? (
          <Button
            variant="secondary"
            onClick={() => window.open(props.whatsapp ?? "", "_blank", "noopener,noreferrer")}
          >
            {t("openWhatsapp")}
          </Button>
        ) : null}
        {order.status === "awaiting_payment" ? (
          <div className="flex flex-wrap gap-2">
            <Button onClick={props.onApprove}>{t("approve")}</Button>
            <Button variant="danger" onClick={props.onReject}>
              {t("reject")}
            </Button>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
