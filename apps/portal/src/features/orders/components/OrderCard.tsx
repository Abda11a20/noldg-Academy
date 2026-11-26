import { Link, Card, CardBody, StatusBadge, Text, Countdown } from "@noldg/ui";
import type { OrderSummary } from "@noldg/api/contracts/orders";
import { formatMoney } from "../../../shared/i18n/formatting";
import { useServerCountdown } from "../../../shared/time/useServerCountdown";
import { OrderAdminMeta } from "./OrderAdminMeta";

interface OrderCardProps {
  order: OrderSummary;
  href: string;
  labels: Readonly<Record<OrderSummary["status"], string>>;
  remainingLabel: string;
  receivedAtMs: number;
  adminView?: boolean;
  adminLabels?: {
    student: (value: string) => string;
    teacher: (value: string) => string;
    sender: (value: string) => string;
    methods: Readonly<Record<"instapay" | "wallet" | "cash", string>>;
  };
}

/** Renders one order summary using the amount returned by the server.
 * @param props Order, navigation target, localized status labels, and injected display clock.
 */
export function OrderCard({
  order,
  href,
  labels,
  remainingLabel,
  receivedAtMs,
  adminView = false,
  adminLabels,
}: OrderCardProps) {
  const countdownValue = useServerCountdown(
    order.expiresAt ?? "",
    order.serverNow ?? "",
    receivedAtMs,
  );
  const remaining = order.expiresAt && order.serverNow ? countdownValue : null;
  return (
    <Card>
      <CardBody className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Link to={href} className="font-semibold">
            {order.orderNumber}
          </Link>
          <Text size="sm" tone="muted">
            {order.product.name}
          </Text>
          {adminView && adminLabels ? <OrderAdminMeta order={order} labels={adminLabels} /> : null}
          <Text size="sm">{formatMoney(order.priceSnapshot.amount)}</Text>
          {remaining !== null && order.status === "awaiting_payment" ? (
            <Countdown remainingSeconds={remaining} label={remainingLabel} />
          ) : null}
        </div>
        <StatusBadge status={order.status} labels={labels} />
      </CardBody>
    </Card>
  );
}
